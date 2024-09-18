from collections import OrderedDict
from app.core.config import TOTAL_SUPPLY_CSV_PATH
from datetime import datetime
import pandas as pd


def get_json_from_csv():
    # Load the CSV into a pandas DataFrame
    df = pd.read_csv(TOTAL_SUPPLY_CSV_PATH)

    # Convert the Date column to datetime for comparison
    df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y')

    # Get the current date
    current_date = datetime.utcnow().date()

    # Filter rows from the earliest date in the CSV to the current date
    df = df[df['Date'].dt.date <= current_date]

    # Sort by date in descending order (latest first)
    df = df.sort_values(by='Date', ascending=False)

    # Round the 'Total Supply' column to 4 decimal places
    df['Total Supply'] = df['Total Supply'].round(4)

    # Create JSON output: dates as keys, total supply as values
    json_output = OrderedDict()
    for _, row in df.iterrows():
        date_str = row['Date'].strftime('%d/%m/%Y')  # Convert back to DD/MM/YYYY format
        total_supply = row['Total Supply']
        json_output[date_str] = total_supply

    return json_output
