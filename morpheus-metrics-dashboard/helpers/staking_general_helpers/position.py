from web3 import Web3
import os, json
import math
from collections import defaultdict
import requests
from app.core.config import (ARB_RPC_URL, STETH_TOKEN_ADDRESS, MOR_ARBITRUM_ADDRESS, UNISWAP_V3_POSITIONS_NFT_ADDRESS,
                             UNISWAP_V3_FACTORY_ADDRESS, POSITIONS_NFT_ABI, FACTORY_NFT_ABI, POOL_ABI)

w3 = Web3(Web3.HTTPProvider(ARB_RPC_URL))

MOR_TOKEN_ADDRESS = MOR_ARBITRUM_ADDRESS
DEX_API_URL = "https://api.dexscreener.io/latest/dex/tokens/{}"

positions_nft_contract = w3.eth.contract(address=w3.to_checksum_address(UNISWAP_V3_POSITIONS_NFT_ADDRESS),
                                         abi=POSITIONS_NFT_ABI)
factory_contract = w3.eth.contract(address=w3.to_checksum_address(UNISWAP_V3_FACTORY_ADDRESS),
                                   abi=FACTORY_NFT_ABI)


def fetch_token_price(token_address):
    """Fetches the token price in USD from the Dex Screener API."""
    api_url = DEX_API_URL.format(token_address)
    response = requests.get(api_url)

    if response.status_code == 200:
        data = response.json()
        if 'pairs' in data and len(data['pairs']) > 0 and 'priceUsd' in data['pairs'][0]:
            return float(data['pairs'][0]['priceUsd'])

    return None


def fetch_all_nfts(address):
    """Fetches all NFTs owned by the address."""
    balance = positions_nft_contract.functions.balanceOf(address).call()
    nfts = []
    for i in range(balance):
        token_id = positions_nft_contract.functions.tokenOfOwnerByIndex(address, i).call()
        nfts.append(token_id)
    return nfts


def get_asset_balances(token_id):
    """Fetches the asset balances for a specific NFT position."""
    position = positions_nft_contract.functions.positions(token_id).call()

    # Extract relevant information
    token0 = position[2]
    token1 = position[3]
    fee = position[4]
    tick_lower = position[5]
    tick_upper = position[6]
    liquidity = position[7]

    # Get pool address
    pool_address = factory_contract.functions.getPool(token0, token1, fee).call()
    pool_contract = w3.eth.contract(address=pool_address, abi=POOL_ABI)

    # Fetch current tick and sqrt price
    slot0 = pool_contract.functions.slot0().call()
    sqrt_price_x96 = slot0[0]
    current_tick = slot0[1]

    # Calculate amounts
    amount0, amount1 = calculate_amounts(liquidity, sqrt_price_x96, current_tick, tick_lower, tick_upper)

    return {
        'token0': {'address': token0, 'amount': amount0},
        'token1': {'address': token1, 'amount': amount1},
        'fee': fee,
        'liquidity': liquidity,
        'tick_lower': tick_lower,
        'tick_upper': tick_upper,
        'current_tick': current_tick
    }


def calculate_amounts(liquidity, sqrt_price_x96, tick_current, tick_lower, tick_upper):
    """Calculates the token balances based on the tick and liquidity."""
    sqrt_ratio_a = math.sqrt(1.0001 ** tick_lower)
    sqrt_ratio_b = math.sqrt(1.0001 ** tick_upper)
    sqrt_price = sqrt_price_x96 / (1 << 96)

    if tick_current < tick_lower:
        amount0 = liquidity * (1 / sqrt_ratio_a - 1 / sqrt_ratio_b)
        amount1 = 0
    elif tick_current < tick_upper:
        amount0 = liquidity * (1 / sqrt_price - 1 / sqrt_ratio_b)
        amount1 = liquidity * (sqrt_price - sqrt_ratio_a)
    else:
        amount0 = 0
        amount1 = liquidity * (sqrt_ratio_b - sqrt_ratio_a)

    return amount0 / (10 ** 18), amount1 / (10 ** 18)  # Convert to standard unit


def protocol_liquidity(address):
    """Fetches and calculates the protocol's liquidity and returns it in USD, MOR, and stETH values."""
    nft_ids = fetch_all_nfts(address)

    if not nft_ids:
        # print(f"No NFTs found for address {address}")
        return

    # print(f"Found {len(nft_ids)} NFTs for address {address}")

    # Fetch MOR and stETH prices
    mor_price = fetch_token_price(MOR_TOKEN_ADDRESS)
    steth_price = fetch_token_price(STETH_TOKEN_ADDRESS)

    if mor_price is None or steth_price is None:
        raise Exception("Could not fetch MOR or stETH prices.")

    aggregated_positions = defaultdict(lambda: {'token0': {'balance': 0, 'address': None},
                                                'token1': {'balance': 0, 'address': None},
                                                'liquidity': 0})

    total_value_usd = 0

    for nft_id in nft_ids:
        balances = get_asset_balances(nft_id)
        key = f"{balances['token0']['address']}_{balances['token1']['address']}_{balances['fee']}"

        aggregated_positions[key]['token0']['address'] = balances['token0']['address']
        aggregated_positions[key]['token1']['address'] = balances['token1']['address']
        aggregated_positions[key]['token0']['balance'] += balances['token0']['amount']
        aggregated_positions[key]['token1']['balance'] += balances['token1']['amount']
        aggregated_positions[key]['liquidity'] += balances['liquidity']

        # Calculate the total value in USD for the position
        token0_value_usd = balances['token0']['amount'] * mor_price
        token1_value_usd = balances['token1']['amount'] * steth_price
        total_value_usd += token0_value_usd + token1_value_usd

    # Convert defaultdict to regular dict for JSON serialization
    aggregated_positions = dict(aggregated_positions)

    # Return USD, MOR, and stETH values
    return {
        "positions": aggregated_positions,
        "total_value_usd": total_value_usd,
        "mor_value": total_value_usd / mor_price if mor_price else 0,
        "steth_value": total_value_usd / steth_price if steth_price else 0
    }
