import json
import os
from fastapi import FastAPI, HTTPException
from fastapi_utils.tasks import repeat_every
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
import numpy as np
import logging

################################# Helpers Imported ###################################################
from helpers.staking_general_helpers.emissions import read_emission_schedule
from helpers.staking_general_helpers.daily_process_script import daily_process
from helpers.staking_general_helpers.position import protocol_liquidity
from helpers.staking_helpers.response_distribution import (analyze_mor_stakers, get_wallet_stake_info,
                                                           calculate_average_multipliers,
                                                           calculate_pool_rewards_summary,give_more_reward_response)
from helpers.supply_helpers.supply_main import (get_historical_total_supply,
                                        get_historical_circulating_supply,
                                        get_historical_prices_and_trading_volume, get_market_cap,
                                        get_mor_holders,
                                        get_historical_locked_and_burnt_mor)
################################# Init & Cache Config ###################################################
app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
      "http://localhost:3000", 
      "http://localhost:3001",
      "https://ccb4a021.mor-explorer-frontend.pages.dev",
      "https://mor-explorer-frontend.pages.dev"
    ],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

logging.getLogger("httpx").disabled = True
logging.getLogger("dune-client").disabled = True
logging.getLogger("DuneClient").disabled = True
logging.getLogger("dune_client.models").disabled = True
logging.getLogger("dune_client").disabled = True
logging.getLogger("app.core.config").disabled = True

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CACHE_FILE = 'cache.json'

# Function to read cache from a file
def read_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as file:
                data = file.read()
                if data.strip():  # Check if the file is not empty
                    return json.loads(data)
                else:
                    return {}  # Return an empty dictionary if the file is empty
        except json.JSONDecodeError as e:
            # Log the error
            print(f"Error reading cache file: {e}")
            # Return an empty dictionary if JSON is invalid
            return {}
    return {}


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def write_cache(cache_data: dict):
    try:
        with open(CACHE_FILE, 'w') as file:
            json.dump(cache_data, file, default=json_serial)
    except Exception as e:
        # Log the error
        print(f"Error writing to cache file: {e}")


################################# Scheduled Cache Update Task ###################################################
@app.on_event("startup")
@repeat_every(seconds=60 * 60 * 23)  # Run every 24 hours
def scheduled_daily_process() -> None:
    logger.info("Starting scheduled daily process")
    try:
        daily_process()
        logger.info("Scheduled daily process completed successfully")
    except Exception as e:
        logger.error(f"Error in scheduled daily process: {str(e)}")


@app.on_event("startup")
@repeat_every(seconds=60 * 60 * 24)  # Run every 24 hours
async def update_cache_task() -> None:
    try:
        cache_data = read_cache()

        # Staking Metrics Cache
        csv_file_path = "helpers/staking_general_helpers/general_csv_files/usermultiplier2.csv"
        emission_file_path = "helpers/staking_general_helpers/general_csv_files/emissions.csv"

        staker_analysis = analyze_mor_stakers(csv_file_path)
        multiplier_analysis = calculate_average_multipliers(csv_file_path)
        stakereward_analysis = calculate_pool_rewards_summary(csv_file_path)
        today = datetime.today()
        formatted_date = today.strftime("%m/%d/%y")
        emissionreward_analysis = read_emission_schedule(formatted_date, emission_file_path)

        # Convert date objects to strings
        staker_analysis['daily_unique_stakers'] = {
            k.isoformat() if isinstance(k, date) else k: v
            for k, v in staker_analysis['daily_unique_stakers'].items()
        }

        # Convert timedelta objects to string representations
        for pool_id, time_delta in staker_analysis['average_stake_time'].items():
            staker_analysis['average_stake_time'][pool_id] = str(time_delta)
        staker_analysis['combined_average_stake_time'] = str(staker_analysis['combined_average_stake_time'])

        # Convert numpy types to Python native types
        def convert_np(obj):
            if isinstance(obj, np.generic):
                return obj.item()
            elif isinstance(obj, dict):
                return {k: convert_np(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_np(i) for i in obj]
            return obj

        emissionreward_analysis = convert_np(emissionreward_analysis)

        # Cache the staking analysis results
        cache_data['staking_metrics'] = {
            "staker_analysis": staker_analysis,
            "multiplier_analysis": {
                "overall_average": float(multiplier_analysis['overall_average']),
                "capital_average": float(multiplier_analysis['capital_average']),
                "code_average": float(multiplier_analysis['code_average'])
            },
            "stakereward_analysis": {str(k): v for k, v in stakereward_analysis.items()},
            "emissionreward_analysis": emissionreward_analysis
        }

        # Supply Metrics Cache
        cache_data['total_and_circ_supply'] = {
            "total_supply": await get_historical_total_supply(),
            "circ_supply": get_historical_circulating_supply()
        }

        # Cache for prices and trading volume
        prices_data, volume_data = await get_historical_prices_and_trading_volume()
        cache_data['prices_and_volume'] = {
            "prices": prices_data["prices"],
            "total_volumes": volume_data["total_volumes"]
        }

        # Cache for market cap
        total_supply_market_cap, circulating_supply_market_cap = await get_market_cap()
        cache_data['market_cap'] = {
            "total_supply_market_cap": total_supply_market_cap,
            "circulating_supply_market_cap": circulating_supply_market_cap
        }

        # Cache for give_mor_reward
        cache_data['give_mor_reward'] = give_more_reward_response()

        # Cache for get_stake_info
        cache_data['stake_info'] = get_wallet_stake_info(csv_file_path)

        # Cache for mor_holders_by_range
        holders_response = await get_mor_holders()
        holders_data = holders_response.result.rows
        clean_holders = [
            holder['amount']
            for holder in holders_data
            if holder['address'] != "0x0000000000000000000000000000000000000000" and holder['amount'] > 0.001
        ]
        ranges = [
            {"range": "0-50", "min": 0, "max": 50},
            {"range": "50-100", "min": 50, "max": 100},
            {"range": "100-200", "min": 100, "max": 200},
            {"range": "200-500", "min": 200, "max": 500},
            {"range": "500-1000", "min": 500, "max": 1000},
            {"range": "1000-10000", "min": 1000, "max": 10000},
            {"range": "10000-500000", "min": 10000, "max": 500000}
        ]
        range_counts = {r['range']: 0 for r in ranges}
        for amount in clean_holders:
            for r in ranges:
                if r['min'] <= amount < r['max']:
                    range_counts[r['range']] += 1
                    break
        cache_data['mor_holders_by_range'] = {"range_counts": range_counts}

        # Cache for locked_and_burnt_mor
        burnt_mor, locked_mor = await get_historical_locked_and_burnt_mor()
        burnt_mor_data = json.loads(burnt_mor)
        locked_mor_data = json.loads(locked_mor)
        cache_data['locked_and_burnt_mor'] = {
            "burnt_mor": {
                "cumulative_mor_burnt": burnt_mor_data["cumulative_mor_burnt"],
                "total_burnt_till_now": burnt_mor_data["total_burnt_till_now"]
            },
            "locked_mor": {
                "cumulative_mor_locked": locked_mor_data["cumulative_mor_locked"],
                "total_locked_till_now": locked_mor_data["total_locked_till_now"]
            }
        }

        # Cache for protocol_liquidity
        result = protocol_liquidity("0x151c2b49CdEC10B150B2763dF3d1C00D70C90956")
        cache_data['protocol_liquidity'] = result

        write_cache(cache_data)

    except Exception as e:
        print(f"Error in cache update task: {str(e)}")

################################# Root Endpoint ###########################################################

@app.get("/")
async def root():
    return {"message": "Hello World"}


################################# Staking Metrics ###########################################################
@app.get("/analyze-mor-stakers")
async def get_mor_staker_analysis():
    cache_data = read_cache()

    if 'staking_metrics' in cache_data:
        return cache_data['staking_metrics']

    # If cache not available, load the data and cache it
    try:
        csv_file_path = "helpers/staking_general_helpers/general_csv_files/usermultiplier2.csv"
        emission_file_path = "helpers/staking_general_helpers/general_csv_files/emissions.csv"

        staker_analysis = analyze_mor_stakers(csv_file_path)
        multiplier_analysis = calculate_average_multipliers(csv_file_path)
        stakereward_analysis = calculate_pool_rewards_summary(csv_file_path)
        today = datetime.today()
        formatted_date = today.strftime("%m/%d/%y")
        emissionreward_analysis = read_emission_schedule(formatted_date, emission_file_path)

        # Convert timedelta objects and date objects to string representations for caching
        # Convert any keys in staker_analysis that are dates to strings
        staker_analysis['daily_unique_stakers'] = {
            str(date): value for date, value in staker_analysis['daily_unique_stakers'].items()
        }

        for pool_id, time_delta in staker_analysis['average_stake_time'].items():
            staker_analysis['average_stake_time'][pool_id] = str(time_delta)
        staker_analysis['combined_average_stake_time'] = str(staker_analysis['combined_average_stake_time'])

        # Convert any date keys/values in stakereward_analysis and emissionreward_analysis to strings before caching
        stakereward_analysis = {str(key): value for key, value in stakereward_analysis.items()}
        emissionreward_analysis = {str(key): value for key, value in emissionreward_analysis.items()}

        # Cache the staking analysis results
        cache_data['staking_metrics'] = {
            "staker_analysis": staker_analysis,
            "multiplier_analysis": {
                "overall_average": float(multiplier_analysis['overall_average']),
                "capital_average": float(multiplier_analysis['capital_average']),
                "code_average": float(multiplier_analysis['code_average'])
            },
            "stakereward_analysis": stakereward_analysis,
            "emissionreward_analysis": emissionreward_analysis
        }

        # Save to cache
        write_cache(cache_data)

        return cache_data['staking_metrics']

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/give_mor_reward")
async def give_more_reward():
    cache_data = read_cache()

    if 'give_mor_reward' in cache_data:
        return cache_data['give_mor_reward']

    try:
        # Call the function to generate the response
        res = give_more_reward_response()

        # Cache the result
        # Ensure that keys in the response are strings before saving to cache
        if isinstance(res, dict):
            res = {str(key): value for key, value in res.items()}

        cache_data['give_mor_reward'] = res
        write_cache(cache_data)

        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/get_stake_info")
async def get_stake_info():
    cache_data = read_cache()

    if 'stake_info' in cache_data:
        return cache_data['stake_info']

    try:
        # Call the function to get the stake information
        csv_file_path = "helpers/staking_general_helpers/general_csv_files/usermultiplier2.csv"
        result = get_wallet_stake_info(csv_file_path)

        # Ensure all keys and values in the result are serializable
        serializable_result = {str(key): value for key, value in result.items()}

        # Cache the result
        cache_data['stake_info'] = serializable_result
        write_cache(cache_data)

        return serializable_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")



######################################### Supply Endpoints ############################################################
@app.get("/total_and_circ_supply")
async def total_and_circ_supply():
    cache_data = read_cache()

    if 'total_and_circ_supply' in cache_data:
        print("Returning cached total_and_circ_supply data")
        # Check if the cached data is properly formatted
        total_and_circ_supply_cache = cache_data['total_and_circ_supply']

        # Ensure that the cached data is in the correct format
        if isinstance(total_and_circ_supply_cache, dict):
            total_supply_data = total_and_circ_supply_cache.get("total_supply", {})
            circ_supply_data = total_and_circ_supply_cache.get("circ_supply", [])

            # Ensure that circ_supply_data is a list
            if isinstance(circ_supply_data, str):
                circ_supply_data = json.loads(circ_supply_data)

            combined_supply = []
            for circ_data in circ_supply_data:
                date = circ_data['date']
                if date in total_supply_data:
                    combined_entry = {
                        "date": date,
                        "total_supply": total_supply_data[date],
                        "circulating_supply": circ_data['circulating_supply'],
                        "total_claimed_that_day": circ_data['total_claimed_that_day']
                    }
                    combined_supply.append(combined_entry)

            combined_supply.sort(key=lambda x: datetime.strptime(x['date'], '%d/%m/%Y'), reverse=True)

            return {"data": combined_supply}

    # If cache not available or invalid, load the data and cache it
    try:
        print("Cache miss for total_and_circ_supply, fetching new data")
        # Fetch data from the source
        total_supply_data = await get_historical_total_supply()
        circ_supply_data = get_historical_circulating_supply()

        # Ensure that circ_supply_data is properly parsed
        if isinstance(circ_supply_data, str):
            circ_supply_data = json.loads(circ_supply_data)

        combined_supply = []
        for circ_data in circ_supply_data:
            date = circ_data['date']
            if date in total_supply_data:
                combined_entry = {
                    "date": date,
                    "total_supply": total_supply_data[date],
                    "circulating_supply": circ_data['circulating_supply'],
                    "total_claimed_that_day": circ_data['total_claimed_that_day']
                }
                combined_supply.append(combined_entry)

        combined_supply.sort(key=lambda x: datetime.strptime(x['date'], '%d/%m/%Y'), reverse=True)

        # Cache the result
        cache_data['total_and_circ_supply'] = {
            "total_supply": total_supply_data,
            "circ_supply": circ_supply_data
        }
        write_cache(cache_data)

        return {"data": combined_supply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/prices_and_trading_volume")
async def historical_prices_and_volume():
    cache_data = read_cache()

    if 'prices_and_volume' in cache_data:
        return cache_data['prices_and_volume']

    # If cache not available, load the data and cache it
    try:
        prices_data, volume_data = await get_historical_prices_and_trading_volume()

        cache_data['prices_and_volume'] = {
            "prices": prices_data["prices"],
            "total_volumes": volume_data["total_volumes"]
        }
        write_cache(cache_data)

        return cache_data['prices_and_volume']

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/get_market_cap")
async def market_cap():
    cache_data = read_cache()

    if 'market_cap' in cache_data:
        return cache_data['market_cap']

    # If cache not available, load the data and cache it
    try:
        total_supply_market_cap, circulating_supply_market_cap = await get_market_cap()

        cache_data['market_cap'] = {
            "total_supply_market_cap": total_supply_market_cap,
            "circulating_supply_market_cap": circulating_supply_market_cap
        }
        write_cache(cache_data)

        return cache_data['market_cap']

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/mor_holders_by_range")
async def mor_holders_by_range():
    cache_data = read_cache()

    if 'mor_holders_by_range' in cache_data:
        print("Returning cached data")  # Debug print
        return cache_data['mor_holders_by_range']

    print("Cache miss, fetching new data")  # Debug print

    try:
        holders_response = await get_mor_holders()
        holders_data = holders_response.result.rows

        clean_holders = [
            holder['amount']
            for holder in holders_data
            if holder['address'] != "0x0000000000000000000000000000000000000000" and holder['amount'] > 0.001
        ]

        ranges = [
            {"range": "0-50", "min": 0, "max": 50},
            {"range": "50-100", "min": 50, "max": 100},
            {"range": "100-200", "min": 100, "max": 200},
            {"range": "200-500", "min": 200, "max": 500},
            {"range": "500-1000", "min": 500, "max": 1000},
            {"range": "1000-10000", "min": 1000, "max": 10000},
            {"range": "10000-500000", "min": 10000, "max": 500000}
        ]

        range_counts = {r['range']: 0 for r in ranges}

        for amount in clean_holders:
            for r in ranges:
                if r['min'] <= amount < r['max']:
                    range_counts[r['range']] += 1
                    break

        result = {"range_counts": range_counts}
        cache_data['mor_holders_by_range'] = result
        write_cache(cache_data)

        print("New data fetched and cached")  # Debug print
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/locked_and_burnt_mor")
async def locked_and_burnt_mor():
    cache_data = read_cache()

    if 'locked_and_burnt_mor' in cache_data:
        return cache_data['locked_and_burnt_mor']

    try:
        # Fetch the historical locked and burnt MOR data
        burnt_mor, locked_mor = await get_historical_locked_and_burnt_mor()

        # Parse JSON and convert keys (dates) to string format to ensure valid JSON serialization
        burnt_mor_data = {str(date): value for date, value in json.loads(burnt_mor)["cumulative_mor_burnt"].items()}
        locked_mor_data = {str(date): value for date, value in json.loads(locked_mor)["cumulative_mor_locked"].items()}

        response_data = {
            "burnt_mor": {
                "cumulative_mor_burnt": burnt_mor_data,
                "total_burnt_till_now": list(burnt_mor_data.values())[-1]
            },
            "locked_mor": {
                "cumulative_mor_locked": locked_mor_data,
                "total_locked_till_now": list(locked_mor_data.values())[-1]
            }
        }

        # Cache the result
        cache_data['locked_and_burnt_mor'] = response_data
        write_cache(cache_data)

        # Return the combined data
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/protocol_liquidity")
async def get_protocol_liquidity():
    cache_data = read_cache()

    if 'protocol_liquidity' in cache_data:
        return cache_data['protocol_liquidity']

    try:
        # Call the protocol_liquidity function with the default address
        result = protocol_liquidity("0x151c2b49CdEC10B150B2763dF3d1C00D70C90956")

        if not result:
            raise HTTPException(status_code=404, detail="No NFTs found for the default address")

        # Cache the result
        cache_data['protocol_liquidity'] = result
        write_cache(cache_data)

        return result  # Return the calculated liquidity in USD, MOR, and stETH values

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
