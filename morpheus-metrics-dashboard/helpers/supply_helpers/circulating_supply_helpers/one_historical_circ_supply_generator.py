from datetime import datetime
import csv
import os
from app.core.config import (web3, MAINNET_BLOCK_1ST_JAN_2024, distribution_contract)

circulating_supply = 0
daily_claims = {}

# Create a filter for UserClaimed events
event_filter = distribution_contract.events.UserClaimed.create_filter(
    from_block=MAINNET_BLOCK_1ST_JAN_2024,
    to_block='latest',
)

# Fetch all events
events = event_filter.get_all_entries()

# Check if CSV file exists, create if not
csv_file = 'csv_files/raw_circulating_supply.csv'
file_exists = os.path.isfile(csv_file)

# Open CSV file in append mode
with open(csv_file, mode='a', newline='') as file:
    writer = csv.writer(file)

    # Write headers if file does not exist
    if not file_exists:
        writer.writerow(
            ["date", "circulating_supply_at_that_date", "block_timestamp_at_that_date", "total_claimed_that_day"]
        )

    # Process each event
    for event in events:
        try:
            # Get block and timestamp
            block_number = event['blockNumber']
            block = web3.eth.get_block(block_number)
            timestamp = block['timestamp']

            # Convert timestamp to DD/MM/YYYY format
            date_str = datetime.utcfromtimestamp(timestamp).strftime('%d/%m/%Y')

            # Calculate amount from event
            amount = float(event['args']['amount']) / pow(10, 18)
            circulating_supply += amount

            # Update daily claims and latest block timestamp for the day
            if date_str not in daily_claims:
                daily_claims[date_str] = {
                    "total_claimed": 0,
                    "latest_block_timestamp": timestamp,
                    "circulating_supply": 0
                }

            daily_claims[date_str]["total_claimed"] += amount
            daily_claims[date_str]["latest_block_timestamp"] = max(daily_claims[date_str]["latest_block_timestamp"], timestamp)
            daily_claims[date_str]["circulating_supply"] = circulating_supply

            # Write to CSV after each event
            writer.writerow([
                date_str,
                daily_claims[date_str]["circulating_supply"],
                daily_claims[date_str]["latest_block_timestamp"],  # Unix timestamp
                daily_claims[date_str]["total_claimed"]
            ])

        except Exception as e:
            print(f"Error processing event: {e}")
            break  # Stop processing if there's an error

print("Data saved to raw_circulating_supply.csv")