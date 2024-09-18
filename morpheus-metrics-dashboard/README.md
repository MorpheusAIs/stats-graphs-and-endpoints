# Morpheus Metrics Dashboard Backend V1 - Supply & Staking

## How to Run:

1) Install the requirements: `pip install -r "requirements.txt"`

2) Create a `.env` file and fill in these values (Refer to the `.env.example` to create this file):
- ```
  RPC_URL=          # ETH RPC URL
  ARB_RPC_URL=      # ARB RPC URL
  ETHERSCAN_API_KEY=
  DUNE_API_KEY=
  DUNE_QUERY_ID=    # Dune Query ID to get MOR holders data
  ```
3) Run: `uvicorn main:app --reload` to run the FastAPI backend.

## Testing

Once uvicorn is up and running, you can navigate to `/tests` and
run `full_mor_metrics_v1_test.py`

- This script will run all endpoints using `pytest` and test if the requests are successful or not along with providing
the response time for each endpoint.