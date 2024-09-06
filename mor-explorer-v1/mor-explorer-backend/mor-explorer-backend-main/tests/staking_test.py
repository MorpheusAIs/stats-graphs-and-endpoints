import requests
import json
import os
import ipdb

# Base URL of your FastAPI server
BASE_URL = "http://127.0.0.1:8000"  # Change this to your server's address if different

# List of endpoints to request
endpoints = [
    "/",
    "/analyze-mor-stakers",
    "/protocol_owned_liqudity",
    "/give_mor_reward"
]

# Create a directory to store the responses
if not os.path.exists("responses"):
    os.makedirs("responses")

# Function to make a request and save the response
def request_and_save(endpoint):
    url = BASE_URL + endpoint
    try:
        ipdb.set_trace();
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Create a file name based on the endpoint
        file_name = endpoint.strip("/").replace("/", "_") or "root"
        file_path = f"responses/{file_name}.json"
        
        # Save the response to a file
        with open(file_path, "w") as f:
            json.dump(response.json(), f, indent=2)
        
        print(f"Response from {endpoint} saved to {file_path}")
    except requests.RequestException as e:
        print(f"Error requesting {endpoint}: {e}")

# Request each endpoint and save the response
for endpoint in endpoints:
    request_and_save(endpoint)

# print("All requests completed.")