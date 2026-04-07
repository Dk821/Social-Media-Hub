"""
Community Engagement Service — Firestore Operations
=====================================================
All Firestore operations for AI Community Engagement Plans.
Follows the same user-isolation pattern as firestore_service.py.

Collection path: users/{uid}/engagement_plans/{plan_id}
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List
from firebase_config import db
from firestore_service import _increment_stat as increment_stat

logger = logging.getLogger(__name__)


# =============================================
#  ENGAGEMENT PLANS (user-scoped)
# =============================================

def save_engagement_plan(uid: str, data: dict) -> dict:
    """Save an engagement plan result under the user's subcollection."""
    plan_id = data["id"]
    data["owner_uid"] = uid

    db.collection("users").document(uid)\
      .collection("engagement_plans").document(plan_id)\
      .set(data)

    logger.info(f"Saved engagement plan {plan_id} for user {uid}")
    return data


def get_engagement_plan(uid: str, plan_id: str) -> Optional[dict]:
    """Get a single engagement plan by ID, scoped to user."""
    doc = db.collection("users").document(uid)\
            .collection("engagement_plans").document(plan_id)\
            .get()
    return doc.to_dict() if doc.exists else None


def get_engagement_plans(
    uid: str,
    page: int = 1,
    limit: int = 10,
    sort: str = "newest",
    filter_by: str = "all"
) -> dict:
    """
    Paginated engagement plans with sorting and filtering.
    Returns { items: [...], total: int, page: int, limit: int, has_more: bool }
    """
    base_query = db.collection("users").document(uid).collection("engagement_plans")

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


def toggle_favorite(uid: str, plan_id: str) -> Optional[bool]:
    """Toggle the is_favorite flag on an engagement plan. Returns new state or None if not found."""
    ref = db.collection("users").document(uid)\
            .collection("engagement_plans").document(plan_id)
    doc = ref.get()
    if not doc.exists:
        return None

    current = doc.to_dict().get("is_favorite", False)
    new_state = not current
    ref.update({"is_favorite": new_state})
    
    # Update global favorites count
    increment_stat(uid, "favorites_count", 1 if new_state else -1)
    
    logger.info(f"Toggled favorite for engagement plan {plan_id} -> {new_state}")
    return new_state


def delete_engagement_plan(uid: str, plan_id: str) -> bool:
    """Delete a single engagement plan."""
    ref = db.collection("users").document(uid)\
            .collection("engagement_plans").document(plan_id)
    doc = ref.get()
    if not doc.exists:
        return False

    ref.delete()
    logger.info(f"Deleted engagement plan {plan_id} for user {uid}")
    return True
