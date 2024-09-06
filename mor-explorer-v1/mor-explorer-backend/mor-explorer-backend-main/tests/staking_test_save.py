import json
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

async def call_endpoint_and_save(endpoint, filename):
    response = client.get(endpoint)
    with open(filename, 'w') as f:
        json.dump(response.json(), f, indent=2)
    print(f"Response from {endpoint} saved to {filename}")

async def main():
    endpoints = [
        #("/", "root_response.json"),
       # ("/analyze-mor-stakers", "mor_staker_analysis.json"),
       # ("/protocol_owned_liquidity", "protocol_owned_liquidity.json"),
       # ("/give_mor_reward", "give_mor_reward.json"),
        ("/get_stake_info", "get_stake_info.json")
    ]

    tasks = [call_endpoint_and_save(endpoint, filename) for endpoint, filename in endpoints]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())