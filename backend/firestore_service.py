"""
Firestore Data Service
=======================
All Firestore operations for user profiles, calendars, and history.
Enforces strict user isolation — every query is scoped by uid.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List
from google.cloud.firestore_v1 import FieldFilter
from firebase_config import db

logger = logging.getLogger(__name__)


# =============================================
#  USER PROFILES
# =============================================

def get_user_profile(uid: str) -> Optional[dict]:
    """Get user profile. Returns None if not found."""
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None


def create_or_update_profile_on_login(uid: str, email: str, name: str, picture: str = "") -> dict:
    """
    Auto-create profile on first login or update last_login.
    Returns the profile dict.
    """
    ref = db.collection("users").document(uid)
    doc = ref.get()

    if doc.exists:
        # Returning user — update last_login
        ref.update({
            "last_login": datetime.now(timezone.utc).isoformat(),
            "name": name or doc.to_dict().get("name", ""),
            "picture": picture or doc.to_dict().get("picture", ""),
        })
        return ref.get().to_dict()
    else:
        # New user — create profile
        profile = {
            "uid": uid,
            "email": email,
            "name": name or email.split("@")[0],
            "picture": picture,
            "joined_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "total_calendars": 0,
            "total_posts": 0,
            "favorites_count": 0,
        }
        ref.set(profile)
        logger.info(f"Created new user profile for {email} (uid={uid})")
        return profile


def update_user_profile(uid: str, updates: dict) -> dict:
    """Update editable profile fields (name, picture)."""
    allowed_fields = {"name", "picture"}
    safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    if safe_updates:
        db.collection("users").document(uid).update(safe_updates)
    return get_user_profile(uid)


# =============================================
#  CALENDARS (user-scoped)
# =============================================

def save_calendar(uid: str, calendar_data: dict) -> dict:
    """Save a generated calendar under the user's subcollection."""
    cal_id = calendar_data["id"]
    calendar_data["is_favorite"] = False
    calendar_data["owner_uid"] = uid

    # Save to users/{uid}/calendars/{cal_id}
    db.collection("users").document(uid)\
      .collection("calendars").document(cal_id)\
      .set(calendar_data)

    # Update usage stats
    _increment_stat(uid, "total_calendars", 1)
    post_count = len(calendar_data.get("posts", []))
    _increment_stat(uid, "total_posts", post_count)

    logger.info(f"Saved calendar {cal_id} for user {uid} ({post_count} posts)")
    return calendar_data


def get_calendar(uid: str, calendar_id: str) -> Optional[dict]:
    """Get a single calendar by ID, scoped to user."""
    doc = db.collection("users").document(uid)\
            .collection("calendars").document(calendar_id)\
            .get()
    return doc.to_dict() if doc.exists else None


def get_calendars(uid: str) -> List[dict]:
    """Get all calendars for a user, newest first."""
    docs = db.collection("users").document(uid)\
             .collection("calendars")\
             .order_by("created_at", direction="DESCENDING")\
             .stream()
    return [doc.to_dict() for doc in docs]


def update_calendar_data(uid: str, calendar_id: str, updates: dict) -> Optional[dict]:
    """Update specific fields of a calendar (e.g., posts array after regenerate)."""
    ref = db.collection("users").document(uid)\
            .collection("calendars").document(calendar_id)
    doc = ref.get()
    if not doc.exists:
        return None
    ref.update(updates)
    return ref.get().to_dict()


def delete_calendar(uid: str, calendar_id: str) -> bool:
    """Delete a calendar and update usage stats."""
    ref = db.collection("users").document(uid)\
            .collection("calendars").document(calendar_id)
    doc = ref.get()
    if not doc.exists:
        return False

    cal_data = doc.to_dict()
    post_count = len(cal_data.get("posts", []))
    was_favorite = cal_data.get("is_favorite", False)

    ref.delete()

    # Decrement stats
    _increment_stat(uid, "total_calendars", -1)
    _increment_stat(uid, "total_posts", -post_count)
    if was_favorite:
        _increment_stat(uid, "favorites_count", -1)

    logger.info(f"Deleted calendar {calendar_id} for user {uid}")
    return True


# =============================================
#  HISTORY (paginated, sorted, filtered)
# =============================================

def get_history(
    uid: str,
    page: int = 1,
    limit: int = 10,
    sort: str = "newest",      # newest | oldest | most_posts
    filter_by: str = "all",    # all | favorites
) -> dict:
    """
    Paginated history with sorting and filtering.
    Returns { items: [...], total: int, page: int, limit: int, has_more: bool }
    """
    base_query = db.collection("users").document(uid).collection("calendars")

    # Apply filter
    if filter_by == "favorites":
        base_query = base_query.where(filter=FieldFilter("is_favorite", "==", True))

    # Get all matching docs for count (Firestore doesn't have native count with pagination easily)
    all_docs = list(base_query.stream())
    total = len(all_docs)

    # Sort in Python (Firestore compound indexes can be tricky with dynamic sort)
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
    elif sort == "most_posts":
        all_docs_data = sorted(
            [d.to_dict() for d in all_docs],
            key=lambda x: len(x.get("posts", [])),
            reverse=True
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


# =============================================
#  FAVORITES
# =============================================

def toggle_favorite(uid: str, calendar_id: str) -> Optional[bool]:
    """
    Toggle favorite status on a calendar.
    Returns new is_favorite value, or None if not found.
    """
    ref = db.collection("users").document(uid)\
            .collection("calendars").document(calendar_id)
    doc = ref.get()
    if not doc.exists:
        return None

    current = doc.to_dict().get("is_favorite", False)
    new_status = not current
    ref.update({"is_favorite": new_status})

    # Update favorites count
    _increment_stat(uid, "favorites_count", 1 if new_status else -1)

    return new_status


# =============================================
#  DASHBOARD STATS (extended profile data)
# =============================================

def get_dashboard_stats(uid: str) -> dict:
    """
    Get extended dashboard stats and recent activity for the profile page.
    Combines data from all 3 modules in a single call.
    Returns: { stats: {...}, recent_activity: [...] }
    """
    # 1. Get base profile stats
    profile = get_user_profile(uid)
    if not profile:
        return {"stats": {}, "recent_activity": []}

    user_ref = db.collection("users").document(uid)

    # 2. Count URL generations
    url_docs = list(user_ref.collection("url_generations").stream())
    url_count = len(url_docs)

    # 3. Count engagement plans
    eng_docs = list(user_ref.collection("engagement_plans").stream())
    eng_count = len(eng_docs)

    # 4. Count caption generations
    cap_docs = list(user_ref.collection("caption_generations").stream())
    cap_count = len(cap_docs)

    # 5. Build recent activity from all modules (last 5)
    activities = []

    # Calendar activities
    cal_docs = list(
        user_ref.collection("calendars")
        .order_by("created_at", direction="DESCENDING")
        .limit(5)
        .stream()
    )
    for doc in cal_docs:
        d = doc.to_dict()
        post_count = len(d.get("posts", []))
        brand = d.get("strategy", {}).get("brand_name", "Unknown")
        activities.append({
            "type": "calendar",
            "title": f"Generated \"{brand}\" Calendar",
            "description": f"{post_count} posts, {d.get('strategy', {}).get('duration_days', 7)} days",
            "created_at": d.get("created_at", ""),
        })

    # URL generation activities
    for doc in url_docs:
        d = doc.to_dict()
        source_url = d.get("source_url", d.get("url", ""))
        fmt = d.get("format", d.get("output_format", "post"))
        # Truncate URL for display
        display_url = source_url[:40] + "..." if len(source_url) > 40 else source_url
        activities.append({
            "type": "url",
            "title": f"Repurposed URL content",
            "description": f"{fmt} from {display_url}",
            "created_at": d.get("created_at", ""),
        })

    # Engagement plan activities
    for doc in eng_docs:
        d = doc.to_dict()
        platform = d.get("platform", "Social")
        goal = d.get("goal", d.get("topic", "engagement"))
        activities.append({
            "type": "engagement",
            "title": f"Created {platform} Engagement Plan",
            "description": f"Goal: {goal[:50]}",
            "created_at": d.get("created_at", ""),
        })

    # Caption/bio generation activities
    for doc in cap_docs:
        d = doc.to_dict()
        platform = d.get("platform", "Social")
        content_type = d.get("content_type", "caption")
        brand = d.get("brand_name", "Unknown")
        var_count = len(d.get("variations", []))
        activities.append({
            "type": "caption",
            "title": f"Generated {platform} {content_type}",
            "description": f"{var_count} variations for {brand}",
            "created_at": d.get("created_at", ""),
        })

    # Sort all activities by created_at descending and take top 5
    activities.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    recent_activity = activities[:5]

    stats = {
        "total_calendars": profile.get("total_calendars", 0),
        "total_posts": profile.get("total_posts", 0),
        "favorites_count": profile.get("favorites_count", 0),
        "url_generations": url_count,
        "engagement_plans": eng_count,
        "caption_generations": cap_count,
        "total_content": profile.get("total_calendars", 0) + url_count + eng_count + cap_count,
    }

    return {
        "stats": stats,
        "recent_activity": recent_activity,
    }


# =============================================
#  INTERNAL HELPERS
# =============================================

def _increment_stat(uid: str, field: str, delta: int):
    """Safely increment a numeric field on the user profile."""
    from google.cloud.firestore_v1 import Increment
    db.collection("users").document(uid).update({field: Increment(delta)})
