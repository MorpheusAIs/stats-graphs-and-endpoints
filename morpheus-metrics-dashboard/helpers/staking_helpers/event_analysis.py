import csv
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def parse_csv_file(file_path):
    data = defaultdict(list)
    transactions = set()
    fieldnames = []
    try:
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            fieldnames = reader.fieldnames
            for row in reader:
                data[row['user']].append(row)
                transactions.add(row['TransactionHash'])
        logger.info(f"Successfully parsed CSV file: {file_path}")
        return data, transactions, fieldnames
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise
    except PermissionError:
        logger.error(f"Permission denied when trying to read file: {file_path}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error when parsing CSV file {file_path}: {str(e)}")
        raise


def analyze_events(stake_data, claim_data):
    stake_wallets = set(stake_data.keys())
    claim_wallets = set(claim_data.keys())

    claim_only = claim_wallets - stake_wallets
    stake_only = stake_wallets - claim_wallets

    return claim_only, stake_only


def write_csv(filename, data, fieldnames):
    with open(filename, 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            writer.writerow(row)


def main():
    # Parse CSV files
    stake_data, stake_txns, stake_fields = parse_csv_file('user_staked_events.csv')
    claim_data, claim_txns, claim_fields = parse_csv_file('user_claim_locked_events.csv')

    # Combine all fields
    all_fields = list(set(stake_fields + claim_fields))

    # Analyze events
    claim_only, stake_only = analyze_events(stake_data, claim_data)

    # Find unique and common transactions
    unique_txns = stake_txns.symmetric_difference(claim_txns)
    common_txns = stake_txns.intersection(claim_txns)

    # Prepare data for unique transactions CSV
    unique_txns_data = []
    for txn in unique_txns:
        for user_data in stake_data.values():
            for row in user_data:
                if row['TransactionHash'] == txn:
                    unique_txns_data.append(row)
                    break
        for user_data in claim_data.values():
            for row in user_data:
                if row['TransactionHash'] == txn:
                    unique_txns_data.append(row)
                    break

    # Prepare data for common transactions CSV
    common_txns_data = []
    for txn in common_txns:
        for user_data in stake_data.values():
            for row in user_data:
                if row['TransactionHash'] == txn:
                    common_txns_data.append(row)
                    break

    # Write unique transactions to CSV
    write_csv('unique_transactions.csv', unique_txns_data, all_fields)

    # Write common transactions to CSV
    write_csv('common_transactions.csv', common_txns_data, all_fields)

    # Print results
    print(f"Number of unique transactions: {len(unique_txns)}")
    print(f"Number of common transactions: {len(common_txns)}")
    print("Unique transactions written to 'unique_transactions.csv'")
    print("Common transactions written to 'common_transactions.csv'")
