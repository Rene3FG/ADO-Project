import schedule
import time
from loguru import logger
from config import SYNC_INTERVAL_SECONDS
from sync_engine import run_sync_cycle

logger.add("logs/sync_{time}.log", rotation="1 day", retention="7 days", level="INFO")

def main():
    logger.info(f"SCA Sync Service iniciado — ciclo cada {SYNC_INTERVAL_SECONDS}s")

    # Primer ciclo inmediato al arrancar
    run_sync_cycle()

    # Ciclos periódicos
    schedule.every(SYNC_INTERVAL_SECONDS).seconds.do(run_sync_cycle)

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
