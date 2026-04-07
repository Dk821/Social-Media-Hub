"""
URL Content Service — Firestore Operations
=============================================
All Firestore operations for URL-based content generations.
Follows the same user-isolation pattern as firestore_service.py.

Collection path: users/{uid}/url_generations/{generation_id}
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List
from firebase_config import db

logger = logging.getLogger(__name__)


# =============================================
#  URL GENERATIONS (user-scoped)
# =============================================

def save_url_generation(uid: str, data: dict) -> dict:
    """Save a URL generation result under the user's subcollection."""
    gen_id = data["id"]
    data["owner_uid"] = uid

    db.collection("users").document(uid)\
      .collection("url_generations").document(gen_id)\
      .set(data)

    logger.info(f"Saved URL generation {gen_id} for user {uid}")
    return data


def get_url_generation(uid: str, gen_id: str) -> Optional[dict]:
    """Get a single URL generation by ID, scoped to user."""
    doc = db.collection("users").document(uid)\
            .collection("url_generations").document(gen_id)\
            .get()
    return doc.to_dict() if doc.exists else None


def get_url_generations(uid: str) -> List[dict]:
    """Get all URL generations for a user, newest first."""
    docs = db.collection("users").document(uid)\
             .collection("url_generations")\
             .order_by("created_at", direction="DESCENDING")\
             .stream()
    return [doc.to_dict() for doc in docs]


def toggle_favorite(uid: str, gen_id: str) -> Optional[bool]:
    """Toggle the is_favorite flag on a URL generation. Returns new state or None if not found."""
    ref = db.collection("users").document(uid)\
            .collection("url_generations").document(gen_id)
    doc = ref.get()
    if not doc.exists:
        return None

    current = doc.to_dict().get("is_favorite", False)
    new_state = not current
    ref.update({"is_favorite": new_state})
    logger.info(f"Toggled favorite for URL generation {gen_id} -> {new_state}")
    return new_state


def delete_url_generation(uid: str, gen_id: str) -> bool:
    """Delete a single URL generation."""
    ref = db.collection("users").document(uid)\
            .collection("url_generations").document(gen_id)
    doc = ref.get()
    if not doc.exists:
        return False

    ref.delete()
    logger.info(f"Deleted URL generation {gen_id} for user {uid}")
    return True
