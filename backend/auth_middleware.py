"""
Firebase Authentication Middleware
===================================
FastAPI dependency that verifies Firebase ID tokens on every protected route.
"""
import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header
from firebase_admin import auth as firebase_auth

logger = logging.getLogger(__name__)


async def get_current_user(authorization: Optional[str] = Header(None, description="Bearer <Firebase ID Token>")):
    """
    FastAPI dependency — extracts and verifies Firebase ID token.
    Returns dict with uid, email, name, picture.
    Raises 401 on missing/invalid/expired tokens.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")

    try:
        decoded = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "name": decoded.get("name", decoded.get("email", "").split("@")[0]),
            "picture": decoded.get("picture", ""),
        }
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired — please re-authenticate")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

