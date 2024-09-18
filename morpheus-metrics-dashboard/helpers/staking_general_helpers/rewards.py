import json
from datetime import datetime, timedelta
import os
import logging
import csv
from collections import defaultdict
from app.core.config import web3, distribution_contract

w3 = web3
contract = distribution_contract


def get_rewards_info(address):
    """
    Get daily reward, total pending reward, and total earned reward for a specific address across all pools.
    
    :param address: Ethereum address of the user
    :return: A dictionary containing rewards info for each pool and total rewards
    """
    rewards_info = {
        'pools': {},
        'total_current_user_reward': 0,
        'total_daily_reward': 0,
        'total_earned_reward': 0
    }

    pool_id = 0
    while True:
        try:
            pool_info = contract.functions.pools(pool_id).call()
        except:
            # If we can't get pool info, we've reached the end of the pools
            break

        # Get current user reward (pending reward) for this pool
        current_user_reward = contract.functions.getCurrentUserReward(pool_id, address).call()
        rewards_info['total_current_user_reward'] += current_user_reward

        # Get user data
        user_data = contract.functions.usersData(address, pool_id).call()
        deposited = user_data[1]
        last_stake = user_data[0]

        # Get pool data
        pool_data = contract.functions.poolsData(pool_id).call()
        total_virtual_deposited = pool_data[2]

        # Unpack pool info
        payout_start, decrease_interval, _, _, _, initial_reward, reward_decrease, _, _ = pool_info

        # Calculate daily reward
        current_time = datetime.now().timestamp()
        intervals_passed = (current_time - payout_start) // decrease_interval
        current_interval_reward = max(0, initial_reward - (intervals_passed * reward_decrease))

        if total_virtual_deposited > 0:
            daily_reward = (current_interval_reward * deposited * 86400) // (
                    total_virtual_deposited * decrease_interval)
        else:
            daily_reward = 0

        rewards_info['total_daily_reward'] += daily_reward

        # Calculate total earned reward (this is an estimate, as we don't have exact claim history)
        time_staked = current_time - last_stake
        total_earned_reward = (daily_reward * time_staked) // 86400
        rewards_info['total_earned_reward'] += total_earned_reward

        # Store pool-specific info
        rewards_info['pools'][pool_id] = {
            'current_user_reward': current_user_reward,
            'daily_reward': daily_reward,
            'earned_reward': total_earned_reward
        }

        pool_id += 1

    return rewards_info
