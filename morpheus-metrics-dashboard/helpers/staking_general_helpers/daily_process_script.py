import logging
import os
from datetime import datetime
from helpers.staking_general_helpers.distribution import (
    EventProcessor, OptimizedMultiplierCalculator, OptimizedRewardCalculator)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def daily_process():
    base_path = os.path.join(os.getcwd(), "helpers", "staking_general_helpers", "general_csv_files")
    event_locked_path = base_path
    claim_locked_path = os.path.join(base_path, "userClaimLocked_events.csv")
    multiplier_path = os.path.join(base_path, "usermultiplier.csv")
    multiplier_path_2 = os.path.join(base_path, "usermultiplier2.csv")

    logger.info("Starting daily processing")

    try:
        # Step 1: Process events
        processor = EventProcessor(event_locked_path)
        processor.process_events("UserClaimLocked")
        logger.info("Finished processing UserClaimLocked events")

        # Step 2: Calculate user multipliers
        multiplier = OptimizedMultiplierCalculator()
        multiplier.get_user_multipliers(claim_locked_path, multiplier_path)
        logger.info("Finished calculating user multipliers")

        # Step 3: Calculate rewards
        calculator = OptimizedRewardCalculator()
        calculator.calculate_rewards(input_csv=multiplier_path, output_csv=multiplier_path_2)
        logger.info("Finished calculating rewards")

        today = datetime.now().strftime("%Y-%m-%d")
        message = f"Daily processing completed successfully for {today}"
        logger.info(message)

    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        raise
    except PermissionError as e:
        logger.error(f"Permission denied: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in daily processing: {str(e)}")
        raise


if __name__ == "__main__":
    try:
        daily_process()
    except Exception as e:
        logger.error(f"Fatal error in main: {str(e)}")
        raise
