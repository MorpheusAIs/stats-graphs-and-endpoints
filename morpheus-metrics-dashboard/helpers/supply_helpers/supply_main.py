import asyncio
import json
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Tuple, List, Dict
import requests
import csv
import httpx
from pathlib import Path
import sys
from dune_client.client import DuneClient
from helpers.supply_helpers.burn_and_locked_helper_arbitrum import get_locked_amounts, get_burned_amounts
from app.core.config import (web3, supply_contract, distribution_contract,
                             MAINNET_BLOCK_1ST_JAN_2024, DEXSCREENER_URL, COINGECKO_HISTORICAL_PRICES,
                             AVERAGE_BLOCK_TIME, TOTAL_SUPPLY_HISTORICAL_DAYS,
                             TOTAL_SUPPLY_HISTORICAL_START_BLOCK, CIRC_SUPPLY_CSV_PATH, logger,
                             DUNE_API_KEY, DUNE_QUERY_ID)
from helpers.supply_helpers.get_historical_total_supply import get_json_from_csv
from helpers.supply_helpers.circulating_supply_helpers.three_update_historical_circ_supply import (
    update_circulating_supply_csv)


async def get_combined_supply_data():
    try:
        # Step 1: Retrieve the updated total supply data
        total_supply_data = get_json_from_csv()

        # Step 2: Get the earliest date from the total supply data
        earliest_total_supply_date = min(
            total_supply_data.keys(), key=lambda x: datetime.strptime(x, '%d/%m/%Y')
        )

        # Step 3: Read circulating supply data from the CSV file (no need for async here)
        circulating_supply_data = get_historical_circulating_supply(earliest_total_supply_date)

        # Step 4: Combine both total supply and circulating supply into the desired format
        combined_data = []
        for date, total_supply in total_supply_data.items():
            if date in circulating_supply_data:
                combined_data.append({
                    "date": date,
                    "total_supply": total_supply,
                    "circulating_supply": circulating_supply_data[date]['circulating_supply'],
                    "total_claimed_that_day": circulating_supply_data[date]['total_claimed_that_day']
                })

        return json.dumps({"data": combined_data}, indent=4)

    except Exception as e:
        print(f"Error occurred while fetching data: {str(e)}")
        return json.dumps({"data": []}, indent=4)


def get_historical_circulating_supply(earliest_date: str, csv_file: str = CIRC_SUPPLY_CSV_PATH) -> dict:
    try:
        # Step 1: Update the CSV file with the latest circulating supply data
        update_circulating_supply_csv(csv_file)

        # Step 2: Read the CSV file for circulating supply data
        circulating_supply_data = {}
        with open(csv_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                date = row['date']
                # Only include data from the earliest_date onwards
                if datetime.strptime(date, '%d/%m/%Y') >= datetime.strptime(earliest_date, '%d/%m/%Y'):
                    circulating_supply_data[date] = {
                        "circulating_supply": float(row['circulating_supply_at_that_date']),
                        "total_claimed_that_day": float(row['total_claimed_that_day'])
                    }

        # Return the circulating supply data
        return circulating_supply_data

    except FileNotFoundError:
        print(f"CSV file not found at {csv_file}")
        return {}
    except Exception as e:
        print(f"An unexpected error occurred while reading the CSV file: {str(e)}")
        return {}


async def get_historical_prices_and_trading_volume() -> Tuple[Dict[str, List[List]], Dict[str, List[List]]]:
    async with httpx.AsyncClient() as client:
        response = await client.get(COINGECKO_HISTORICAL_PRICES)
        data = response.json()

    def process_data(data_points: List[Tuple[int, float]]) -> List[List]:
        # Dictionary to hold aggregated data by day
        aggregated_data = defaultdict(list)

        # Convert timestamps to DD/MM/YYYY and aggregate data by day
        for timestamp, value in data_points:
            date = datetime.utcfromtimestamp(timestamp / 1000).strftime('%d/%m/%Y')
            aggregated_data[date].append(value)

        # Average the values for each day
        averaged_data = []
        for date, values in aggregated_data.items():
            averaged_value = round((sum(values) / len(values)), 4)
            averaged_data.append([date, averaged_value])

        # Sort the data with the latest date at the top
        averaged_data.sort(key=lambda x: datetime.strptime(x[0], '%d/%m/%Y'), reverse=True)

        return averaged_data

    # Process prices and total_volumes
    sorted_prices = process_data(data['prices'])
    sorted_volumes = process_data(data['total_volumes'])

    # Create JSON structures
    prices_json = {"prices": sorted_prices}
    volumes_json = {"total_volumes": sorted_volumes}

    return prices_json, volumes_json


async def get_current_total_supply() -> float:
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor() as pool:
        total_supply = await loop.run_in_executor(pool,
                                                  supply_contract.functions.getTotalRewards().call)

        return round((total_supply / 10 ** 18), 4)


async def get_current_circulating_supply() -> float:
    circulating_supply = 0

    event_filter = distribution_contract.events.UserClaimed.create_filter(
        from_block=MAINNET_BLOCK_1ST_JAN_2024,
        to_block='latest',
    )

    events = event_filter.get_all_entries()

    for event in events:
        amount = float(event['args']['amount']) / pow(10, 18)
        circulating_supply += amount

    return round(circulating_supply, 4)


async def get_current_mor_price() -> float:
    response = requests.get(DEXSCREENER_URL)

    if response.status_code == 200:
        data = response.json()
        mor_price = float(data['pairs'][0]['priceUsd'])
    else:
        mor_price = 0.0
    return mor_price


async def get_market_cap() -> Tuple[float, float]:
    current_mor_price = await get_current_mor_price()
    current_circulating_supply = await get_current_circulating_supply()
    current_total_supply = await get_current_total_supply()

    total_supply_market_cap = current_total_supply * current_mor_price
    circulating_supply_market_cap = current_circulating_supply * current_mor_price

    return round(total_supply_market_cap, 4), round(circulating_supply_market_cap, 4)


async def get_historical_locked_and_burnt_mor() -> Tuple[Dict[str, List[List]], Dict[str, List[List]]]:
    burnt_mor = await get_burned_amounts()
    locked_mor = await get_locked_amounts()

    return burnt_mor, locked_mor


async def get_mor_holders():
    dune = DuneClient(
        api_key=DUNE_API_KEY,
        base_url="https://api.dune.com",
        request_timeout=300
    )

    token_holders = dune.get_latest_result(DUNE_QUERY_ID)
    return token_holders
