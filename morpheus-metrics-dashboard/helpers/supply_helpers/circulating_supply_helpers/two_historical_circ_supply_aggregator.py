import csv
from datetime import datetime
from collections import defaultdict


def process_csv(input_file, output_file):
    # Read the input CSV file
    with open(input_file, 'r') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # Group data by date
    grouped_data = defaultdict(list)
    for row in data:
        date = datetime.strptime(row['date'], '%d/%m/%Y').date()
        grouped_data[date].append(row)

    # Select the record with the latest block timestamp for each day
    aggregated_data = []
    for date, records in grouped_data.items():
        latest_record = max(records, key=lambda x: int(x['block_timestamp_at_that_date']))
        aggregated_data.append(latest_record)

    # Sort the aggregated data by date (latest to earliest)
    aggregated_data.sort(key=lambda x: datetime.strptime(x['date'], '%d/%m/%Y'), reverse=True)

    # Write the result to a new CSV file
    with open(output_file, 'w', newline='') as f:
        fieldnames = ['date', 'circulating_supply_at_that_date', 'block_timestamp_at_that_date',
                      'total_claimed_that_day']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(aggregated_data)

    print(f"Processed data has been written to {output_file}")


# Usage
input_file = 'csv_files/raw_circulating_supply.csv'  # Replace with your input file name
output_file = 'csv_files/consolidated_circ_supply.csv'  # Replace with your desired output file name
process_csv(input_file, output_file)
