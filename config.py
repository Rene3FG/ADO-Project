import os
from dotenv import load_dotenv

load_dotenv()

# ── Google Sheets
SPREADSHEET_ID      = os.getenv("SPREADSHEET_ID", "1bHoYKL5U14JfmhwwoLMHwzOtGbFbA_1sRF75P5G18sY")
GOOGLE_CREDS_FILE   = os.getenv("GOOGLE_CREDS_FILE", "credentials/service_account.json")

# ── PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sca_user:password@localhost:5432/sca_db"
)

# ── Sync 
SYNC_INTERVAL_SECONDS = int(os.getenv("SYNC_INTERVAL_SECONDS", "120"))  # cada 2 minutos

# Evito bucles
CONFLICT_THRESHOLD_SECONDS = int(os.getenv("CONFLICT_THRESHOLD_SECONDS", "10"))
