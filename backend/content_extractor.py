"""
Content Extractor — URL Content Extraction Module
====================================================
Handles URL validation, type detection, and text extraction from:
  - YouTube videos (via youtube-transcript-api)
  - Web pages / blogs / articles (via requests + BeautifulSoup)

Usage:
  from content_extractor import extract_content
  result = extract_content("https://www.youtube.com/watch?v=...")
"""

import re
import logging
from typing import Optional
from urllib.parse import urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Maximum characters to send to AI (avoids token overflow)
MAX_CONTENT_CHARS = 12000

# Request timeout for web scraping
REQUEST_TIMEOUT = 15

# User-Agent to avoid basic bot blocks
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


# ──────────────────────────────────────────────
# URL Validation & Type Detection
# ──────────────────────────────────────────────

def validate_url(url: str) -> bool:
    """Check if the string is a valid HTTP/HTTPS URL."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def detect_url_type(url: str) -> str:
    """Detect whether a URL is a YouTube video or a regular webpage."""
    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    youtube_hosts = [
        "youtube.com", "www.youtube.com", "m.youtube.com",
        "youtu.be", "www.youtu.be",
    ]

    if any(hostname == h for h in youtube_hosts):
        return "youtube"

    return "webpage"


def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Extract the video ID from various YouTube URL formats:
      - https://www.youtube.com/watch?v=VIDEO_ID
      - https://youtu.be/VIDEO_ID
      - https://www.youtube.com/embed/VIDEO_ID
      - https://www.youtube.com/shorts/VIDEO_ID
    """
    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    if hostname in ("youtu.be", "www.youtu.be"):
        # Short URL: https://youtu.be/VIDEO_ID
        return parsed.path.lstrip("/").split("/")[0] or None

    if "youtube.com" in hostname:
        if parsed.path.startswith("/watch"):
            # Standard: ?v=VIDEO_ID
            qs = parse_qs(parsed.query)
            ids = qs.get("v")
            return ids[0] if ids else None
        elif parsed.path.startswith(("/embed/", "/shorts/")):
            # Embed or Shorts
            parts = parsed.path.split("/")
            return parts[2] if len(parts) > 2 else None

    return None


# ──────────────────────────────────────────────
# YouTube Transcript Extraction
# ──────────────────────────────────────────────

def extract_youtube_transcript(video_id: str) -> str:
    """
    Extract transcript from a YouTube video using youtube-transcript-api.
    Tries English first, then falls back to any available language.
    Raises descriptive errors for common failure cases.
    """
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import (
        TranscriptsDisabled,
        NoTranscriptFound,
        VideoUnavailable,
    )

    try:
        ytt_api = YouTubeTranscriptApi()

        # Try English first
        try:
            transcript = ytt_api.fetch(video_id, languages=["en", "en-US", "en-GB"])
        except NoTranscriptFound:
            # Fall back to any available transcript
            transcript_list = ytt_api.list(video_id)
            available = list(transcript_list)
            if not available:
                raise ValueError("No transcripts available for this video")
            transcript = ytt_api.fetch(video_id, languages=[available[0].language_code])

        # Combine segments into plain text
        full_text = " ".join(
            snippet.text for snippet in transcript
        )
        return clean_text(full_text)

    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video. The creator has turned off captions.")
    except VideoUnavailable:
        raise ValueError("This video is unavailable. It may be private, deleted, or region-restricted.")
    except NoTranscriptFound:
        raise ValueError("No transcript found for this video in any language.")
    except Exception as e:
        logger.error(f"YouTube transcript extraction failed: {e}")
        raise ValueError(f"Failed to extract transcript: {str(e)}")


# ──────────────────────────────────────────────
# Web Page Content Extraction
# ──────────────────────────────────────────────

def extract_webpage_content(url: str) -> str:
    """
    Fetch a web page and extract its main readable content.
    Looks for <article>, <main>, or falls back to <body>.
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else "unknown"
        if status == 403:
            raise ValueError("Access denied (403). This website blocks automated scraping.")
        elif status == 404:
            raise ValueError("Page not found (404). Please check the URL.")
        else:
            raise ValueError(f"HTTP error {status} while fetching the page.")
    except requests.exceptions.ConnectionError:
        raise ValueError("Could not connect to this URL. Please check the address.")
    except requests.exceptions.Timeout:
        raise ValueError("Request timed out. The website took too long to respond.")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to fetch URL: {str(e)}")

    soup = BeautifulSoup(response.text, "lxml")

    # Remove noise elements
    for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside", "form", "iframe"]):
        tag.decompose()

    # Try to find main content in priority order
    main_content = None

    for selector in ["article", "main", '[role="main"]', ".post-content", ".entry-content", ".article-body"]:
        main_content = soup.select_one(selector)
        if main_content:
            break

    if not main_content:
        main_content = soup.find("body")

    if not main_content:
        raise ValueError("Could not extract readable content from this page.")

    # Extract text with basic paragraph separation
    text = main_content.get_text(separator="\n", strip=True)
    return clean_text(text)


# ──────────────────────────────────────────────
# Text Cleaning & Chunking
# ──────────────────────────────────────────────

def clean_text(raw: str) -> str:
    """Clean raw extracted text — normalize whitespace, remove junk."""
    # Collapse multiple newlines
    text = re.sub(r"\n{3,}", "\n\n", raw)
    # Collapse multiple spaces
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Strip
    text = text.strip()
    return text


def chunk_text(text: str, max_chars: int = MAX_CONTENT_CHARS) -> str:
    """Truncate text to fit within AI token budget, preserving sentence boundaries."""
    if len(text) <= max_chars:
        return text

    # Try to cut at a sentence boundary
    truncated = text[:max_chars]
    last_period = truncated.rfind(".")
    if last_period > max_chars * 0.7:
        return truncated[: last_period + 1]

    return truncated + "..."


# ──────────────────────────────────────────────
# Main Entry Point
# ──────────────────────────────────────────────

def extract_content(url: str) -> dict:
    """
    Main function — validate URL, detect type, extract content.

    Returns:
      {
        "url_type": "youtube" | "webpage",
        "raw_text": str,
        "text_preview": str (first 500 chars),
      }

    Raises ValueError on any extraction failure.
    """
    if not validate_url(url):
        raise ValueError("Invalid URL. Please provide a valid HTTP or HTTPS link.")

    url_type = detect_url_type(url)

    if url_type == "youtube":
        video_id = extract_youtube_video_id(url)
        if not video_id:
            raise ValueError("Could not extract video ID from this YouTube URL.")
        logger.info(f"Extracting YouTube transcript for video: {video_id}")
        raw_text = extract_youtube_transcript(video_id)
    else:
        logger.info(f"Extracting webpage content from: {url}")
        raw_text = extract_webpage_content(url)

    if not raw_text or len(raw_text.strip()) < 50:
        raise ValueError("Extracted content is too short or empty. Please try a different URL.")

    # Chunk if necessary
    processed_text = chunk_text(raw_text)

    return {
        "url_type": url_type,
        "raw_text": processed_text,
        "text_preview": processed_text[:500],
    }
