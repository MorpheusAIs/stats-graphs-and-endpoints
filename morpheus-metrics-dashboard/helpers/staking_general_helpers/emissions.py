import pandas as pd
from typing import List, Dict
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def read_emission_schedule(today_date: datetime, file_path: str) -> Dict:
    """
    Read the emission schedule CSV file and return a dictionary with processed data.

    Args:
    file_path (str): Path to the CSV file
    today_date (datetime): Current date

    Returns:
    Dict: Dictionary containing processed emission data
    """
    try:
        df = pd.read_csv(file_path, sep='|', skipinitialspace=True)
        df = df.dropna(axis=1, how='all')  # Remove empty columns

        # Strip whitespace from column names and string columns
        df.columns = df.columns.str.strip()
        df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)

        df['Date'] = pd.to_datetime(df['Date'], format='%m/%d/%y', errors='coerce')
        numeric_columns = df.columns.drop(['Day', 'Date'])
        df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors='coerce')

        # Filter data up to today's date
        df_until_today = df[df['Date'] <= today_date]

        if df_until_today.empty:
            logger.warning("No data found up to the specified date.")
            return {'new_emissions': {}, 'total_emissions': {}}

        # Calculate new emissions for today
        last_day = df_until_today.iloc[-1]
        previous_day = df_until_today.iloc[-2] if len(df_until_today) > 1 else pd.Series(0, index=last_day.index)

        emission_categories = ['Capital Emission', 'Code Emission', 'Compute Emission', 'Community Emission',
                               'Protection Emission']

        new_emissions = {category: last_day[category] - previous_day[category] for category in emission_categories}
        total_emissions = {category: df_until_today[category].sum() for category in emission_categories}

        new_emissions['Total Emission'] = sum(new_emissions.values())
        total_emissions['Total Emission'] = df_until_today['Total Emission'].sum()

        logger.info(f"Successfully processed emission data up to {today_date}")
        return {
            'new_emissions': new_emissions,
            'total_emissions': total_emissions
        }
    except FileNotFoundError:
        logger.error(f"Emission schedule file not found: {file_path}")
        raise
    except Exception as e:
        logger.error(f"Error processing emission schedule: {str(e)}")
        raise


def calculate_total_emissions(df: pd.DataFrame) -> List[Dict]:
    """
    Calculate the total emissions for each category.

    Args:
    df (pd.DataFrame): DataFrame containing the emission schedule data

    Returns:
    List[Dict]: List of dictionaries containing the total emissions for each category
    """
    emission_categories = ['Capital Emission', 'Code Emission', 'Compute Emission', 'Community Emission',
                           'Protection Emission']
    return [{"category": category, "total": df[category].sum()} for category in emission_categories]
