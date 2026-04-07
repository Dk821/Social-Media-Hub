"""
Caption & Bio Generator Service — Firestore Operations
========================================================
All Firestore operations for AI Caption & Bio generations.
Follows the same user-isolation pattern as community_engagement_service.py.

Collection path: users/{uid}/caption_generations/{gen_id}
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List
from firebase_config import db
from firestore_service import _increment_stat as increment_stat

logger = logging.getLogger(__name__)


# =============================================
#  CAPTION GENERATIONS (user-scoped)
# =============================================

def save_caption_generation(uid: str, data: dict) -> dict:
    """Save a caption/bio generation result under the user's subcollection."""
    gen_id = data["id"]
    data["owner_uid"] = uid

    db.collection("users").document(uid)\
      .collection("caption_generations").document(gen_id)\
      .set(data)

    logger.info(f"Saved caption generation {gen_id} for user {uid}")
    return data


def get_caption_generation(uid: str, gen_id: str) -> Optional[dict]:
    """Get a single caption generation by ID, scoped to user."""
    doc = db.collection("users").document(uid)\
            .collection("caption_generations").document(gen_id)\
            .get()
    return doc.to_dict() if doc.exists else None


def get_caption_generations(
    uid: str,
    page: int = 1,
    limit: int = 10,
    sort: str = "newest",
    filter_by: str = "all"
) -> dict:
    """
    Paginated caption generations with sorting and filtering.
    Returns { items: [...], total: int, page: int, limit: int, has_more: bool }
    """
    base_query = db.collection("users").document(uid).collection("caption_generations")

    # Apply filter
    if filter_by == "favorites":
        from google.cloud.firestore_v1 import FieldFilter
        base_query = base_query.where(filter=FieldFilter("is_favorite", "==", True))

    # Get all matching docs for count
    all_docs = list(base_query.stream())
    total = len(all_docs)

    # Sort in Python
    if sort == "newest":
        all_docs_data = sorted(
            [d.to_dict() for d in all_docs],
            key=lambda x: x.get("created_at", ""),
            reverse=True
        )
    elif sort == "oldest":
        all_docs_data = sorted(
            [d.to_dict() for d in all_docs],
            key=lambda x: x.get("created_at", "")
        )
    else:
        all_docs_data = [d.to_dict() for d in all_docs]

    # Paginate
    start = (page - 1) * limit
    end = start + limit
    items = all_docs_data[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": end < total,
    }


def toggle_favorite(uid: str, gen_id: str) -> Optional[bool]:
    """Toggle the is_favorite flag on a caption generation. Returns new state or None if not found."""
    ref = db.collection("users").document(uid)\
            .collection("caption_generations").document(gen_id)
    doc = ref.get()
    if not doc.exists:
        return None

    current = doc.to_dict().get("is_favorite", False)
    new_state = not current
    ref.update({"is_favorite": new_state})
    
    # Update global favorites count
    increment_stat(uid, "favorites_count", 1 if new_state else -1)
    
    logger.info(f"Toggled favorite for caption generation {gen_id} -> {new_state}")
    return new_state


def delete_caption_generation(uid: str, gen_id: str) -> bool:
    """Delete a single caption generation."""
    ref = db.collection("users").document(uid)\
            .collection("caption_generations").document(gen_id)
    doc = ref.get()
    if not doc.exists:
        return False

    ref.delete()
    logger.info(f"Deleted caption generation {gen_id} for user {uid}")
    return True
