import json
from web3 import Web3
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BURN_START_BLOCK = 0
MAINNET_BLOCK_1ST_JAN_2024 = 18913400  # 1st January 2024
AVERAGE_BLOCK_TIME = 15
TOTAL_SUPPLY_HISTORICAL_DAYS = 30
TOTAL_SUPPLY_HISTORICAL_START_BLOCK = 20432592  # 1st August 2024

ETH_RPC_URL = os.getenv("RPC_URL")
ARB_RPC_URL = os.getenv("ARB_RPC_URL")
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")
DUNE_API_KEY = os.getenv("DUNE_API_KEY")
DUNE_QUERY_ID = os.getenv("DUNE_QUERY_ID")

web3 = Web3(Web3.HTTPProvider(ETH_RPC_URL))
web3_arb = Web3(Web3.HTTPProvider(ARB_RPC_URL))

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))

CIRC_SUPPLY_CSV_PATH = os.path.join(project_root,
                                    'helpers/supply_helpers/circulating_supply_helpers/csv_files',
                                    'consolidated_circ_supply.csv')

TOTAL_SUPPLY_CSV_PATH = os.path.join(project_root,
                                     'helpers/supply_helpers/total_supply_csv/',
                                     'total_supply_schedule.csv')

supply_abi_path = os.path.join(project_root, 'abi', 'supply_abi.json')
distribution_abi_path = os.path.join(project_root, 'abi', 'distribution_abi.json')
erc20_abi_path = os.path.join(project_root, 'abi', 'erc_20_abi.json')
json_path_position = os.path.join(project_root, 'abi', 'position_nft_abi.json')
json_path_factory = os.path.join(project_root, 'abi', 'uniswap_factory_abi.json')
json_path_pool = os.path.join(project_root, 'abi', 'pool_uniswap_abi.json')

with open(supply_abi_path, 'r') as file:
    supply_abi = json.load(file)
with open(distribution_abi_path, 'r') as file:
    distribution_abi = json.load(file)
with open(erc20_abi_path, 'r') as file:
    erc20_abi = json.load(file)
with open(json_path_position, 'r') as file:
    POSITIONS_NFT_ABI = json.load(file)
with open(json_path_factory, 'r') as file:
    FACTORY_NFT_ABI = json.load(file)
with open(json_path_pool, 'r') as file:
    POOL_ABI = json.load(file)

BURN_FROM_ADDRESS = "0x151c2b49CdEC10B150B2763dF3d1C00D70C90956"
BURN_TO_ADDRESS = "0x000000000000000000000000000000000000dead"
SAFE_ADDRESS = "0xb1972e86B3380fd69DCb395F98D39fbF1A5f305A"
SUPPLY_PROXY_ADDRESS = "0x6CFe1dDfd88890E08276c7FA9D6DCa1cA4A224a9"
DISTRIBUTION_PROXY_ADDRESS = "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790"
MOR_MAINNET_ADDRESS = "0xcbb8f1bda10b9696c57e13bc128fe674769dcec0"
MOR_ARBITRUM_ADDRESS = "0x092bAaDB7DEf4C3981454dD9c0A0D7FF07bCFc86"
STETH_TOKEN_ADDRESS = '0x5300000000000000000000000000000000000004'
UNISWAP_V3_POSITIONS_NFT_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

PRICES_AND_VOLUME_DATA_DAYS = 300
COINGECKO_HISTORICAL_PRICES = (f"https://api.coingecko.com/api/v3/coins/morpheusai/contract/"
                               f"{MOR_ARBITRUM_ADDRESS}/market_chart?"
                               f"vs_currency=usd&days={PRICES_AND_VOLUME_DATA_DAYS}")

DEXSCREENER_URL = f"https://api.dexscreener.com/latest/dex/tokens/{MOR_ARBITRUM_ADDRESS}"

SUPPLY_ABI = supply_abi
DISTRIBUTION_ABI = distribution_abi
ERC20_ABI = erc20_abi

supply_contract = web3.eth.contract(address=web3.to_checksum_address(SUPPLY_PROXY_ADDRESS),
                                    abi=SUPPLY_ABI)
distribution_contract = web3.eth.contract(address=web3.to_checksum_address(DISTRIBUTION_PROXY_ADDRESS),
                                          abi=DISTRIBUTION_ABI)
