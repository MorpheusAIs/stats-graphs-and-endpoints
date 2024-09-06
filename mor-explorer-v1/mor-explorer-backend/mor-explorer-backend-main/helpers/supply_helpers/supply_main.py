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
from helpers.supply_helpers.circulating_supply_helpers.three_update_historical_circ_supply import update_circulating_supply_csv
from helpers.supply_helpers.burn_and_locked_helper_arbitrum import get_locked_amounts, get_burned_amounts
from app.core.config import (web3, supply_contract, distribution_contract,
                             MAINNET_BLOCK_1ST_JAN_2024, DEXSCREENER_URL, COINGECKO_HISTORICAL_PRICES,
                             AVERAGE_BLOCK_TIME, TOTAL_SUPPLY_HISTORICAL_DAYS,
                             TOTAL_SUPPLY_HISTORICAL_START_BLOCK, CIRC_SUPPLY_CSV_PATH, logger,
                             DUNE_API_KEY, DUNE_QUERY_ID)


async def get_total_supply_at_block_helper(block_number: int) -> float:
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor() as pool:
        total_supply = await loop.run_in_executor(pool,
                                                  lambda: supply_contract.functions.
                                                  getTotalRewards().
                                                  call(block_identifier=block_number))
        return round((total_supply / 10**18), 4)


async def get_historical_total_supply() -> dict:
    start_block = TOTAL_SUPPLY_HISTORICAL_START_BLOCK
    days = TOTAL_SUPPLY_HISTORICAL_DAYS
    current_block = web3.eth.get_block('latest')['number']
    blocks_per_day = (24 * 60 * 60) // AVERAGE_BLOCK_TIME
    historical_data = defaultdict(list)

    # Collecting total supply_helpers data
    for day in range(days):
        block_number = start_block + day * blocks_per_day
        if block_number > current_block:
            block_number = current_block  # Use the latest block if we go beyond the latest block

        total_supply = await get_total_supply_at_block_helper(block_number)
        date = (datetime.utcnow() - timedelta(days=days - day)).strftime('%d/%m/%Y')
        historical_data[date].append(total_supply)

    # Include today's data (latest block)
    total_supply_today = await get_total_supply_at_block_helper(current_block)
    historical_data[datetime.utcnow().strftime('%d/%m/%Y')].append(total_supply_today)

    # Averaging the values if multiple blocks fall on the same day
    averaged_data = {date: sum(supplies)/len(supplies) for date, supplies in historical_data.items()}

    # Sorting the data in chronological order (latest first)
    sorted_data = dict(sorted(averaged_data.items(), key=lambda x: datetime.strptime(x[0], '%d/%m/%Y'),
                              reverse=True))

    return sorted_data


def get_historical_circulating_supply(csv_file: str = CIRC_SUPPLY_CSV_PATH) -> str:
    try:
        # First, update the CSV file to get the latest data in the csv
        update_circulating_supply_csv(csv_file)

        # Get current date
        current_date = datetime.now().strftime('%d/%m/%Y')

        # Read the CSV file
        with open(csv_file, 'r') as f:
            reader = csv.DictReader(f)
            data = list(reader)

        if not data:
            logger.error("CSV file is empty.")
            return json.dumps([])

        # Sort data by date (latest first)
        data.sort(key=lambda x: datetime.strptime(x['date'], '%d/%m/%Y'), reverse=True)

        # Calculate the date 30 days ago
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%d/%m/%Y')

        # Filter and format the last 30 days of data
        result = []
        for row in data:
            date = row['date']
            if datetime.strptime(date, '%d/%m/%Y') < datetime.strptime(thirty_days_ago, '%d/%m/%Y'):
                break
            try:
                result.append({
                    "date": date,
                    "circulating_supply": float(row['circulating_supply_at_that_date']),
                    "total_claimed_that_day": float(row['total_claimed_that_day'])
                })
            except ValueError as e:
                logger.error(f"Error processing row {row}: {str(e)}")
                continue

        # Fill in missing days with the last known value
        while len(result) < 30:
            if not result:
                # If result is empty, start from current date with zero values
                prev_date = current_date
                prev_supply = 0
                prev_claimed = 0
            else:
                last_date = datetime.strptime(result[-1]['date'], '%d/%m/%Y')
                prev_date = (last_date - timedelta(days=1)).strftime('%d/%m/%Y')
                prev_supply = result[-1]['circulating_supply']
                prev_claimed = 0  # Set to 0 for filled-in days

            result.append({
                "date": prev_date,
                "circulating_supply": prev_supply,
                "total_claimed_that_day": prev_claimed
            })

        # Sort the result to ensure it's in descending order (latest first)
        result.sort(key=lambda x: datetime.strptime(x['date'], '%d/%m/%Y'), reverse=True)

        logger.info(f"Retrieved {len(result)} days of supply data.")
        return json.dumps(result[:30], indent=2)  # Ensure we return exactly 30 days of data

    except FileNotFoundError:
        logger.error(f"CSV file not found at {csv_file}")
        return json.dumps([])
    except Exception as e:
        logger.error(f"An unexpected error occurred: {str(e)}")
        return json.dumps([])


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

        return round((total_supply / 10**18), 4)


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
    print("Calling Dune API")  # Debug print
    dune = DuneClient(
        api_key=DUNE_API_KEY,
        base_url="https://api.dune.com",
        request_timeout=300
    )

    token_holders = dune.get_latest_result(DUNE_QUERY_ID)
    return token_holders
