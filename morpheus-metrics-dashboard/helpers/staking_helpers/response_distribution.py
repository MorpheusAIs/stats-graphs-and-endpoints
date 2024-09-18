import json
import os
import logging
from datetime import datetime, timedelta
import csv
from collections import defaultdict
from decimal import Decimal
import requests
import ipdb
from helpers.staking_general_helpers.distribution import OptimizedMultiplierCalculator, OptimizedRewardCalculator
import numpy as np
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def is_valid_stake(row):
    current_time = int(datetime.now().timestamp())
    claim_lock_start = int(row['claimLockStart'])
    claim_lock_end = int(row['claimLockEnd'])
    twenty_years_from_now = current_time + (25 * 365 * 24 * 60 * 60)  # 20 years in seconds

    return (claim_lock_start != 0 and
            claim_lock_end != 0 and
            claim_lock_end > current_time and
            claim_lock_end <= twenty_years_from_now)

def analyze_mor_stakers(csv_file_path):
    # Initialize data structures
    stakers_by_pool = {0: set(), 1: set()}
    stakers_by_pool_and_date = defaultdict(lambda: defaultdict(set))
    total_stake_time = {0: timedelta(), 1: timedelta()}
    stake_count = {0: 0, 1: 0}

    try:
        with open(csv_file_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if not is_valid_stake(row):
                    continue

                timestamp = datetime.fromisoformat(row['Timestamp']).date()
                pool_id = int(row['poolId'])
                user = row['user']

                # Add to overall pool stakers
                stakers_by_pool[pool_id].add(user)

                # Add to date-specific pool stakers
                stakers_by_pool_and_date[timestamp][pool_id].add(user)

                # Calculate stake time
                claim_lock_start = int(row['claimLockStart'])
                claim_lock_end = int(row['claimLockEnd'])
                stake_time = timedelta(seconds=claim_lock_end - claim_lock_start)

                # Add to total stake time
                total_stake_time[pool_id] += stake_time
                stake_count[pool_id] += 1

        logger.info(f"Successfully analyzed MOR stakers from file: {csv_file_path}")

        # Calculate average stake time
        avg_stake_time = {
            pool_id: (total_time / count if count > 0 else timedelta())
            for pool_id, total_time in total_stake_time.items()
            for count in [stake_count[pool_id]]
        }

        # Calculate combined average stake time
        total_combined_stake_time = sum(total_stake_time.values(), timedelta())
        total_combined_stakes = sum(stake_count.values())
        combined_avg_stake_time = total_combined_stake_time / total_combined_stakes \
            if total_combined_stakes > 0 else timedelta()

        # Prepare results
        results = {
            'total_unique_stakers': {
                'pool_0': len(stakers_by_pool[0]),
                'pool_1': len(stakers_by_pool[1]),
                'combined': len(stakers_by_pool[0] | stakers_by_pool[1])
            },
            'daily_unique_stakers': defaultdict(lambda: {'pool_0': 0, 'pool_1': 0, 'combined': 0}),
            'average_stake_time': avg_stake_time,
            'combined_average_stake_time': combined_avg_stake_time,
            'total_stakes': stake_count
        }

        # Process daily data
        for date, pools in stakers_by_pool_and_date.items():
            results['daily_unique_stakers'][date] = {
                'pool_0': len(pools[0]),
                'pool_1': len(pools[1]),
                'combined': len(pools[0] | pools[1])
            }

    except FileNotFoundError:
        logger.error(f"File not found: {csv_file_path}")
        raise
    except PermissionError:
        logger.error(f"Permission denied when trying to read file: {csv_file_path}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error when analyzing MOR stakers from file {csv_file_path}: {str(e)}")
        raise

    return results


def calculate_average_multipliers(csv_file_path):
    total_multiplier = Decimal('0')
    capital_multiplier = Decimal('0')
    code_multiplier = Decimal('0')
    total_count = 0
    capital_count = 0
    code_count = 0

    with open(csv_file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if not is_valid_stake(row):
                continue

            multiplier = Decimal(row['multiplier']) / Decimal('1e18')  # Convert from wei to whole units
            total_multiplier += multiplier
            total_count += 1

            if row['poolId'] == '0':  # Capital pool
                capital_multiplier += multiplier
                capital_count += 1
            elif row['poolId'] == '1':  # Code pool
                code_multiplier += multiplier
                code_count += 1

    # Calculate averages
    average_multiplier = total_multiplier / total_count if total_count > 0 else Decimal('0')
    average_capital_multiplier = capital_multiplier / capital_count if capital_count > 0 else Decimal('0')
    average_code_multiplier = code_multiplier / code_count if code_count > 0 else Decimal('0')

    return {
        'overall_average': average_multiplier,
        'capital_average': average_capital_multiplier,
        'code_average': average_code_multiplier
    }
    
def calculate_pool_rewards_summary(csv_file_path):
    pool_rewards = defaultdict(lambda: {'daily_reward_sum': 0, 'total_current_user_reward_sum': 0})
    
    with open(csv_file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if not is_valid_stake(row):
                continue

            pool_id = row['poolId']
            daily_reward = float(row['daily_reward']) / (10 ** 18)
            total_current_user_reward = float(row['total_current_user_reward']) / (10 ** 18)
            
            pool_rewards[pool_id]['daily_reward_sum'] += daily_reward
            pool_rewards[pool_id]['total_current_user_reward_sum'] += total_current_user_reward
    
    return pool_rewards

def calculate_power_factor(staking_period_days):
    # Convert days to years
    years = staking_period_days // 365
    
    # Define static multipliers for years 0-6
    multipliers = [1, 2.12, 4.17, 6.08, 7.82, 9.35, 10.67]
    
    # If years is greater than 6, use the last multiplier
    if years >= 6:
        return multipliers[-1]
    else:
        return multipliers[years]

def get_crypto_price(crypto_id):
    base_url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        "ids": crypto_id,
        "vs_currencies": "usd"
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        data = response.json()

        if crypto_id in data and "usd" in data[crypto_id]:
            return data[crypto_id]["usd"]
        else:
            return None
    except requests.RequestException as e:
        print(f"An error occurred: {e}")
        return None

def calculate_mor_rewards(mor_daily_emission, staking_period_days,mor_price, eth_price):
    calculator = OptimizedRewardCalculator()
    total_virtual_steth = calculator.get_virtual_steth_pool(0)
    # Calculate power factor
    power_factor = calculate_power_factor(staking_period_days)
    # Calculate APR
    apr = (mor_daily_emission * 365 * mor_price * power_factor) / (total_virtual_steth * eth_price)
    # Calculate APY assuming compounding once per year
    apy = (1 + apr) ** 1 - 1
    # Calculate daily MOR rewards per 1 deposited stETH
    daily_mor_rewards = (mor_daily_emission * power_factor) / total_virtual_steth
    return apy, daily_mor_rewards

def give_more_reward_response():
    mor_daily_emission = 3456  # Replace with the actual daily emission
    staking_periods = [0, 365, 730, 1095, 1460, 1825, 2190]  # 0, 1 year, 2 years, 3 years, 4 years, 5 years, 6 years
    
    # print(f"MOR Rewards Calculator")
    # print(f"MOR Daily Emission: {mor_daily_emission}")
    mor_price = get_crypto_price("morpheusai")
    eth_price = get_crypto_price("staked-ether")  # WETH address
    
    # print("\nAPY per 1 deposited stETH:")
    rewards_data = {
        "apy_per_steth": [],
        "daily_mor_rewards_per_steth": []
    }
    
    for period in staking_periods:
        apy, daily_mor_rewards = calculate_mor_rewards(mor_daily_emission, period,mor_price, eth_price)
        rewards_data["apy_per_steth"].append({
            "staking_period": period,
            "apy": f"{apy:.2%}"
        })
        rewards_data["daily_mor_rewards_per_steth"].append({
            "staking_period": period,
            "daily_mor_rewards": f"{daily_mor_rewards:.6f}"
        })
    return rewards_data

def get_wallet_stake_info(csv_file_path):
    wallet_info = {}
    # Read and process CSV data
    with open(csv_file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if not is_valid_stake(row):
                continue

            wallet = row['user']
        
            # Calculate stake time
            claim_lock_start = int(row['claimLockStart'])
            claim_lock_end = int(row['claimLockEnd'])
            stake_time = timedelta(seconds=claim_lock_end - claim_lock_start)
            
            # Get power multiplier
            power_multiplier = int(row['multiplier'])
            
            # Update wallet info
            if wallet not in wallet_info or stake_time > wallet_info[wallet]['stake_time']:
                wallet_info[wallet] = {
                    'stake_time': stake_time,
                    'power_multiplier': power_multiplier
                }
    
    stake_times = np.array([v["stake_time"].total_seconds() for v in wallet_info.values()])
    power_multipliers = np.array([v["power_multiplier"]/1e25 for v in wallet_info.values()])

    year_in_seconds = 365.25 * 24 * 60 * 60
    stake_times_in_years = stake_times / year_in_seconds

    def bin_data_custom_ranges(data, bins):
        bin_indices = np.digitize(data, bins, right=True)
        frequencies = np.bincount(bin_indices, minlength=len(bins))[1:]
        ranges = [[float(bins[i]), float(bins[i+1]) if i < len(bins)-2 else None] for i in range(len(bins)-1)]
        return ranges, frequencies.tolist()

    stake_time_bins_years = [0, 1, 2, 3, 4, 5, 1000]  # Using 1000 years as an effective "infinity"
    stake_time_ranges, stake_time_frequencies = bin_data_custom_ranges(stake_times_in_years, stake_time_bins_years)

    power_multiplier_bins = np.linspace(np.min(power_multipliers), np.max(power_multipliers), 11)
    power_multiplier_ranges, power_multiplier_frequencies = bin_data_custom_ranges(power_multipliers, power_multiplier_bins)

    output = {
        "stake_time": {
            "ranges": stake_time_ranges,
            "frequencies": stake_time_frequencies
        },
        "power_multiplier": {
            "ranges": power_multiplier_ranges,
            "frequencies": power_multiplier_frequencies
        }
    }

    return output
