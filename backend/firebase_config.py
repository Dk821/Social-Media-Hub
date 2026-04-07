"""
Firebase Admin SDK Configuration
=================================
Initializes Firebase Admin SDK and exports Firestore client.
Place your service account JSON at: backend/firebase-service-account.json
"""
import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from pathlib import Path

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# --- Locate service account credentials ---
SERVICE_ACCOUNT_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_PATH",
    str(ROOT_DIR / "firebase-service-account.json")
)

def _init_firebase():
    """Initialize Firebase Admin SDK. Safe to call multiple times."""
    if firebase_admin._apps:
        return firestore.client()

    try:
        if os.path.exists(SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized with service account file.")
        elif os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON"):
            # Support JSON string in env var (for Docker / cloud deploy)
            info = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"])
            cred = credentials.Certificate(info)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized with env var JSON.")
        else:
            raise FileNotFoundError(
                f"Firebase service account not found at '{SERVICE_ACCOUNT_PATH}' "
                "and FIREBASE_SERVICE_ACCOUNT_JSON env var is not set."
            )
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise

# Module-level Firestore client
db = _init_firebase()
