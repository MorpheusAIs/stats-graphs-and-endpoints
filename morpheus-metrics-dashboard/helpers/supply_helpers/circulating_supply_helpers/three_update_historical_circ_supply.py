import csv
from datetime import datetime
from web3.exceptions import BlockNotFound
from pathlib import Path
from app.core.config import (web3, distribution_contract)


def get_block_number_by_timestamp(timestamp):
    """Binary search to find the block number closest to the given timestamp."""
    left = 1
    right = web3.eth.get_block('latest')['number']

    while left <= right:
        mid = (left + right) // 2
        try:
            mid_block = web3.eth.get_block(mid)
            if mid_block['timestamp'] == timestamp:
                return mid
            elif mid_block['timestamp'] < timestamp:
                left = mid + 1
            else:
                right = mid - 1
        except BlockNotFound:
            right = mid - 1

    return left  # Return the closest block number


def update_circulating_supply_csv(csv_file):
    # Read the existing CSV
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        existing_data = list(reader)

    if not existing_data:
        print("Error: CSV file is empty")
        return

    # Create a dictionary of existing data for easy lookup and update
    existing_data_dict = {row['date']: row for row in existing_data}

    latest_record = max(existing_data, key=lambda x: int(x['block_timestamp_at_that_date']))
    latest_block_timestamp = int(latest_record['block_timestamp_at_that_date'])
    latest_circulating_supply = float(latest_record['circulating_supply_at_that_date'])

    # Find the block number for the latest timestamp
    start_block = get_block_number_by_timestamp(latest_block_timestamp)
    start_block += 1

    # Create a filter for UserClaimed events from the latest block timestamp
    event_filter = distribution_contract.events.UserClaimed.create_filter(
        from_block=start_block,
        to_block='latest'
    )

    # Fetch all new events
    events = event_filter.get_all_entries()

    # Process new events
    new_data = {}
    for event in events:
        try:
            block_number = event['blockNumber']
            block = web3.eth.get_block(block_number)
            timestamp = block['timestamp']
            date_str = datetime.utcfromtimestamp(timestamp).strftime('%d/%m/%Y')

            amount = float(event['args']['amount']) / 10 ** 18
            latest_circulating_supply += amount

            if date_str not in new_data:
                new_data[date_str] = {
                    "circulating_supply": latest_circulating_supply,
                    "block_timestamp": timestamp,
                    "total_claimed": 0
                }

            new_data[date_str]["total_claimed"] += amount
            new_data[date_str]["block_timestamp"] = max(new_data[date_str]["block_timestamp"], timestamp)
            new_data[date_str]["circulating_supply"] = latest_circulating_supply

        except BlockNotFound:
            print(f"Block {block_number} not found. Skipping...")
            continue
        except Exception as e:
            print(f"Error processing event: {e}")
            break

    # Update existing data and add new records
    for date, data in new_data.items():
        new_record = {
            "date": date,
            "circulating_supply_at_that_date": data["circulating_supply"],
            "block_timestamp_at_that_date": data["block_timestamp"],
            "total_claimed_that_day": data["total_claimed"]
        }

        if date in existing_data_dict:
            # Update existing record if new block timestamp is later
            if data["block_timestamp"] > int(existing_data_dict[date]["block_timestamp_at_that_date"]):
                existing_data_dict[date] = new_record
        else:
            # Add new record
            existing_data_dict[date] = new_record

    # Convert back to list and sort
    updated_data = list(existing_data_dict.values())
    updated_data.sort(key=lambda x: datetime.strptime(x['date'], '%d/%m/%Y'), reverse=True)

    # Write the updated data back to CSV
    with open(csv_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "circulating_supply_at_that_date", "block_timestamp_at_that_date", "total_claimed_that_day"
        ])
        writer.writeheader()
        writer.writerows(updated_data)

    # print(f"Updated {csv_file}. Total records: {len(updated_data)}")
    return len(updated_data)  # Return number of records as a success indicator
