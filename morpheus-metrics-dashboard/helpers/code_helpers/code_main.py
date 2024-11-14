import json
from collections import OrderedDict
import asyncio
from sheets_config.google_utils import read_sheet_to_dataframe
from app.core.config import USER_STAKED_SHEET_NAME, logger
import pandas as pd
from app.core.config import ETH_RPC_URL, DISTRIBUTION_ABI, DISTRIBUTION_PROXY_ADDRESS
from web3 import AsyncWeb3

w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(ETH_RPC_URL))

distribution_contract = w3.eth.contract(address=w3.to_checksum_address(DISTRIBUTION_PROXY_ADDRESS),
                                        abi=DISTRIBUTION_ABI)


async def get_current_user_weights(wallet_address):
    wallet_address = w3.to_checksum_address(wallet_address)
    data = await distribution_contract.functions.usersData(wallet_address, 1).call()
    weights = int(data[1])

    return weights


async def process_batch(batch):
    tasks = [get_current_user_weights(row) for row in batch]
    return await asyncio.gather(*tasks)


async def get_active_code_contributors(contributors_list):
    batch_size = 50  # Adjust this value based on your needs and rate limits
    active_contributors = []
    total_batches = len(contributors_list) // batch_size + (1 if len(contributors_list) % batch_size else 0)

    for i in range(0, len(contributors_list), batch_size):
        batch = contributors_list[i:i + batch_size]
        logger.info(f"Processing batch {i // batch_size + 1}/{total_batches}")

        try:
            # Process the batch and get weights
            weights = await process_batch(batch)

            # Pair addresses with their weights
            for address, weight in zip(batch, weights):
                if weight > 0:
                    active_contributors.append({
                        'address': address,
                        'weight': weight
                    })

        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            continue

    return len(active_contributors)


async def get_total_weights_and_contributors():
    try:
        # Read the data from the Google Sheets
        user_staked_df = read_sheet_to_dataframe(USER_STAKED_SHEET_NAME)

    except Exception as e:
        logger.error(f"Error reading sheets: {str(e)}")
        return OrderedDict(), pd.DataFrame()

    # Ensure the DataFrame has the required columns
    required_columns = ["Timestamp", "TransactionHash", "BlockNumber", "PoolId", "User", "Amount"]

    if not all(col in user_staked_df.columns for col in required_columns):
        logger.error(f"DataFrame is missing required columns: {required_columns}")
        return OrderedDict(), pd.DataFrame()

    try:
        # Handle any NaN or invalid data types gracefully
        user_staked_df["PoolId"] = pd.to_numeric(user_staked_df["PoolId"], errors="coerce")
        user_staked_df["Amount"] = pd.to_numeric(user_staked_df["Amount"], errors="coerce")

        # Filter out invalid rows where 'PoolId' or 'Amount' is NaN
        valid_data = user_staked_df.dropna(subset=["PoolId", "Amount"])

        # Get the number of unique contributors and the total amount for PoolId = 1
        contributor_addresses_list = valid_data[valid_data['PoolId'] == 1]['User'].unique()
        unique_contributors = valid_data[valid_data['PoolId'] == 1]['User'].nunique()
        total_weights = valid_data[valid_data['PoolId'] == 1]['Amount'].sum()

        # Prepare JSON output
        json_output = {
            "total_weights_assigned": total_weights,
            "unique_contributors": unique_contributors,
            "active_contributors": await get_active_code_contributors(contributor_addresses_list)
        }

        return json_output

    except Exception as e:
        logger.exception(f"Error processing data: {str(e)}")
        return OrderedDict(), pd.DataFrame()


# asyncio.run(get_total_weights_and_contributors())
