import csv
import logging
import os
from datetime import datetime
from web3 import Web3
from app.core.config import ETH_RPC_URL, distribution_contract

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RPC_URL = ETH_RPC_URL
START_BLOCK = 20180927
BATCH_SIZE = 1000000


class EventProcessor:
    def __init__(self, output_dir):
        self.web3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.contract = distribution_contract
        self.distribution_abi = self.contract.abi
        self.output_dir = output_dir

    def get_events_in_batches(self, start_block, end_block, event_name):
        current_start = start_block
        while current_start <= end_block:
            current_end = min(current_start + BATCH_SIZE, end_block)
            try:
                yield from self.get_events(current_start, current_end, event_name)
            except Exception as e:
                logger.error(f"Error getting events from block {current_start} to {current_end}: {str(e)}")
            current_start = current_end + 1

    def get_events(self, from_block, to_block, event_name):
        try:
            event_filter = getattr(self.contract.events, event_name).create_filter(from_block=from_block,
                                                                                   to_block=to_block)
            return event_filter.get_all_entries()
        except Exception as e:
            logger.error(f"Error getting events for {event_name} from block {from_block} to {to_block}: {str(e)}")
            return []

    def write_to_csv(self, events, filename, headers, mode='w'):
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, mode, newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            if mode == 'w':
                writer.writeheader()

            for event in events:
                row = {
                    'Timestamp': datetime.fromtimestamp(self.web3.eth
                                                        .get_block(event['blockNumber'])['timestamp']).isoformat(),
                    'TransactionHash': event['transactionHash'].hex(),
                    'BlockNumber': event['blockNumber']
                }
                row.update(event['args'])
                writer.writerow(row)
        logger.info(f"CSV file {filename} has been updated successfully.")

    def get_event_headers(self, event_name):
        event_abi = next((e for e in self.distribution_abi if e['type'] == 'event' and e['name'] == event_name), None)
        if not event_abi:
            raise ValueError(f"Event {event_name} not found in ABI")
        return ['Timestamp', 'TransactionHash', 'BlockNumber'] + [input['name'] for input in event_abi['inputs']]

    def get_last_block_from_csv(self, filename):
        try:
            filepath = os.path.join(self.output_dir, filename)
            with open(filepath, 'r') as csvfile:
                reader = csv.DictReader(csvfile)
                return max(int(row['BlockNumber']) for row in reader)
        except FileNotFoundError:
            return None
        except ValueError:
            logger.warning(f"CSV file {filename} is empty or corrupted. Starting from default block.")
            return None

    def process_events(self, event_name):
        try:
            latest_block = self.web3.eth.get_block('latest')['number']
            headers = self.get_event_headers(event_name)
            filename = f"{event_name.lower()}_events.csv"
            last_processed_block = self.get_last_block_from_csv(filename)

            if last_processed_block is None:
                start_block = START_BLOCK
                mode = 'w'
            else:
                start_block = last_processed_block + 1
                mode = 'a'

            events = list(self.get_events_in_batches(start_block, latest_block, event_name))
            logger.info(f"Processing {len(events)} new {event_name} events from block {start_block} to {latest_block}")

            if events:
                self.write_to_csv(events, filename, headers, mode)
            else:
                logger.info(f"No new events found for {event_name}.")

        except Exception as e:
            logger.error(f"An error occurred in process_events: {str(e)}")
            logger.exception("Exception details:")


class OptimizedMultiplierCalculator:
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.contract = distribution_contract

    def get_user_multipliers(self, input_csv, output_csv):
        try:
            with open(input_csv, 'r') as infile, open(output_csv, 'w', newline='') as outfile:
                reader = csv.DictReader(infile)

                # Check if fieldnames are None and provide default headers if necessary
                if reader.fieldnames is None:
                    default_fieldnames = ['Timestamp', 'TransactionHash', 'BlockNumber', 'user', 'poolId']
                    fieldnames = default_fieldnames + ['multiplier']
                    logger.warning(f"No headers found in {input_csv}. Using default headers: {default_fieldnames}")
                else:
                    fieldnames = reader.fieldnames + ['multiplier']

                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()

                for row in reader:
                    try:
                        pool_id = int(row.get('poolId', 0))
                        user = self.web3.to_checksum_address(
                            row.get('user', '0x0000000000000000000000000000000000000000'))
                        timestamp = datetime.fromisoformat(row.get('Timestamp', datetime.now().isoformat()))
                        block_number = self.get_block_number(timestamp)
                        multiplier = self.contract.functions.getCurrentUserMultiplier(pool_id, user).call(
                            block_identifier=block_number)
                        row['multiplier'] = multiplier
                        writer.writerow(row)
                    except Exception as e:
                        logger.error(f"Error processing row {row}: {str(e)}")
        except Exception as e:
            logger.error(f"Error in get_user_multipliers: {str(e)}")
            raise

    def get_block_number(self, timestamp):
        return self.web3.eth.get_block('latest', full_transactions=False)['number']


class OptimizedRewardCalculator:
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.contract = distribution_contract

    def calculate_rewards(self, input_csv, output_csv):
        try:
            with open(input_csv, 'r') as infile, open(output_csv, 'w', newline='') as outfile:
                reader = csv.DictReader(infile)

                # Check if fieldnames are None and provide default headers if necessary
                if reader.fieldnames is None:
                    default_fieldnames = ['Timestamp', 'TransactionHash', 'BlockNumber', 'user', 'poolId', 'multiplier']
                    fieldnames = default_fieldnames + ['daily_reward', 'total_current_user_reward']
                    logger.warning(f"No headers found in {input_csv}. Using default headers: {default_fieldnames}")
                else:
                    fieldnames = reader.fieldnames + ['daily_reward', 'total_current_user_reward']

                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()

                for row in reader:
                    try:
                        address = self.web3.to_checksum_address(
                            row.get('user', '0x0000000000000000000000000000000000000000'))
                        pool_id = int(row.get("poolId", 0))
                        timestamp = datetime.fromisoformat(row.get('Timestamp', datetime.now().isoformat()))
                        block_number = self.get_block_number(timestamp)

                        daily_reward = self.calculate_daily_reward(pool_id, address, block_number)
                        total_reward = self.contract.functions.getCurrentUserReward(pool_id, address).call(
                            block_identifier=block_number)

                        row['daily_reward'] = daily_reward
                        row['total_current_user_reward'] = total_reward
                        writer.writerow(row)
                    except Exception as e:
                        logger.error(f"Error processing row {row}: {str(e)}")
        except Exception as e:
            logger.error(f"Error in calculate_rewards: {str(e)}")
            raise

    def calculate_daily_reward(self, pool_id, address, block_number):
        pool_data = self.contract.functions.poolsData(pool_id).call(block_identifier=block_number)
        total_virtual_deposited = pool_data[2]

        pool_info = self.contract.functions.pools(pool_id).call(block_identifier=block_number)
        payout_start, decrease_interval, _, _, _, initial_reward, reward_decrease, _, _ = pool_info

        user_data = self.contract.functions.usersData(address, pool_id).call(block_identifier=block_number)
        deposited = user_data[1]

        current_time = self.web3.eth.get_block(block_number)['timestamp']
        intervals_passed = (current_time - payout_start) // decrease_interval
        current_interval_reward = max(0, initial_reward - (intervals_passed * reward_decrease))

        if total_virtual_deposited > 0:
            daily_reward = (current_interval_reward * deposited * 86400) // (
                    total_virtual_deposited * decrease_interval)
        else:
            daily_reward = 0

        return daily_reward

    def get_block_number(self, timestamp):
        return self.web3.eth.get_block('latest', full_transactions=False)['number']

    def get_virtual_steth_pool(self, pool_id):
        pools_data = self.contract.functions.poolsData(pool_id).call()
        return pools_data[2] / 1e18
