import json
import numpy as np

# Load the data
with open('get_stake_info.json', 'r') as f:
    data = json.load(f)

# Extract stake_time and power_multiplier from the data
stake_times = []
power_multipliers = []

for key, value in data.items():
    stake_times.append(value["stake_time"])
    power_multipliers.append(value["power_multiplier"] / 10000000000000000000000000)

# Convert lists to numpy arrays for easier manipulation
stake_times = np.array(stake_times)
power_multipliers = np.array(power_multipliers)

# Define custom stake time ranges in years (instead of seconds)
stake_time_bins_years = [0, 1, 2, 3, 4, 5, np.inf]  # 0-1, 1-2, 2-3, etc. in years

# Convert stake times from seconds to years
year_in_seconds = 365.25 * 24 * 60 * 60  # 1 year in seconds
stake_times_in_years = stake_times / year_in_seconds


# Function to bin the data using custom ranges
def bin_data_custom_ranges(data, bins):
    bin_indices = np.digitize(data, bins, right=True)
    bin_frequencies = np.bincount(bin_indices, minlength=len(bins))

    # Create bin ranges and frequencies
    bin_ranges = [(bins[i], bins[i + 1]) for i in range(len(bins) - 1)]
    frequencies = bin_frequencies[1:]  # Removing the count for out-of-range data

    return bin_ranges, frequencies


# Bin the stake_time data using custom year ranges
stake_time_ranges, stake_time_frequencies = bin_data_custom_ranges(stake_times_in_years, stake_time_bins_years)

# Bin the power_multiplier data into 10 bins (keeping it automatic for this)
power_multiplier_ranges, power_multiplier_frequencies = bin_data_custom_ranges(power_multipliers,
                                                                               np.linspace(np.min(power_multipliers),
                                                                                           np.max(power_multipliers),
                                                                                           11))

# Prepare the output in a dictionary format for FE
output = {
    "stake_time": {
        "ranges": stake_time_ranges,
        "frequencies": stake_time_frequencies.tolist()  # Convert numpy array to list for JSON serialization
    },
    "power_multiplier": {
        "ranges": power_multiplier_ranges,
        "frequencies": power_multiplier_frequencies.tolist()  # Convert numpy array to list for JSON serialization
    }
}

# Print the output or save it to a JSON file
print(json.dumps(output, indent=2))

# Optional: save the result to a file
with open('binned_data.json', 'w') as f:
    json.dump(output, f, indent=2)
