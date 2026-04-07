"""
AI Gateway — Multi-Provider Failover Architecture
===================================================
Supports: Gemini, OpenAI, Grok (xAI), OpenRouter
Two-level failover:
  Level 1 → Gemini key rotation (shuffled)
  Level 2 → Provider chain (AI_PROVIDERS order)

Usage:
  from ai_gateway import generate_ai_response
  result = await generate_ai_response("Your prompt here")
"""
# env reload trigger: 2026-02-27

import os
import logging
import random
import asyncio
from typing import Optional, List

import google.generativeai as genai
from openai import AsyncOpenAI

logger = logging.getLogger("ai_gateway")

# ──────────────────────────────────────────────
# Configuration (loaded from environment)
# ──────────────────────────────────────────────

TIMEOUT_SECONDS = 30

SYSTEM_PROMPT = (
    "You are a professional social media content strategist. "
    "Generate engaging, platform-appropriate content."
)


def _get_provider_order() -> List[str]:
    """Parse AI_PROVIDERS from env. Default: gemini,openai,openrouter,grok"""
    raw = os.getenv("AI_PROVIDERS", "gemini,openai,openrouter,grok")
    return [p.strip().lower() for p in raw.split(",") if p.strip()]


def _get_gemini_keys() -> List[str]:
    """
    Collect Gemini keys from:
      - GEMINI_API_KEYS (comma-separated)
      - GEMINI_API_KEY  (legacy single key)
    """
    keys: List[str] = []
    multi = os.getenv("GEMINI_API_KEYS", "")
    if multi:
        keys.extend([k.strip() for k in multi.split(",") if k.strip()])
    single = os.getenv("GEMINI_API_KEY", "")
    if single and single not in keys:
        keys.append(single)
    return keys


# ──────────────────────────────────────────────
# Provider: Gemini  (Level 1 — key rotation)
# ──────────────────────────────────────────────

async def call_gemini(prompt: str) -> Optional[str]:
    """
    Try every available Gemini key (shuffled) until one succeeds.
    Returns the response text or None if all keys fail.
    """
    keys = _get_gemini_keys()
    if not keys:
        logger.warning("Gemini — no API keys configured, skipping")
        return None

    model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    random.shuffle(keys)

    for idx, key in enumerate(keys, 1):
        try:
            logger.info(f"Gemini — trying key {idx}/{len(keys)}")
            genai.configure(api_key=key)
            model = genai.GenerativeModel(model_name)

            full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    model.generate_content,
                    full_prompt,
                    generation_config={
                        "temperature": 0.85,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 4096,
                    },
                ),
                timeout=TIMEOUT_SECONDS,
            )

            if response.text:
                logger.info("Gemini — success")
                return response.text.strip()
            else:
                logger.warning(f"Gemini — key {idx} returned empty response")

        except asyncio.TimeoutError:
            logger.warning(f"Gemini — key {idx} timed out ({TIMEOUT_SECONDS}s)")
        except Exception as e:
            logger.warning(f"Gemini — key {idx} failed: {e}")

    logger.error("Gemini — all keys exhausted")
    return None


# ──────────────────────────────────────────────
# Provider: OpenAI
# ──────────────────────────────────────────────

async def call_openai(prompt: str) -> Optional[str]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        logger.warning("OpenAI — no API key configured, skipping")
        return None

    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")

    try:
        logger.info(f"OpenAI — calling {model_name}")
        client = AsyncOpenAI(api_key=api_key, timeout=TIMEOUT_SECONDS)

        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.85,
            max_tokens=4096,
        )

        text = response.choices[0].message.content
        if text:
            logger.info("OpenAI — success")
            return text.strip()
        else:
            logger.warning("OpenAI — empty response")
            return None

    except Exception as e:
        logger.error(f"OpenAI — failed: {e}")
        return None


# ──────────────────────────────────────────────
# Provider: Grok (xAI)  — OpenAI-compatible API
# ──────────────────────────────────────────────

async def call_grok(prompt: str) -> Optional[str]:
    api_key = os.getenv("GROK_API_KEY", "")
    if not api_key:
        logger.warning("Grok — no API key configured, skipping")
        return None

    model_name = os.getenv("GROK_MODEL_NAME", "grok-3-mini")

    try:
        logger.info(f"Grok — calling {model_name}")
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1",
            timeout=TIMEOUT_SECONDS,
        )

        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.85,
            max_tokens=4096,
        )

        text = response.choices[0].message.content
        if text:
            logger.info("Grok — success")
            return text.strip()
        else:
            logger.warning("Grok — empty response")
            return None

    except Exception as e:
        logger.error(f"Grok — failed: {e}")
        return None


# ──────────────────────────────────────────────
# Provider: OpenRouter — OpenAI-compatible API
# ──────────────────────────────────────────────

async def call_openrouter(prompt: str) -> Optional[str]:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        logger.warning("OpenRouter — no API key configured, skipping")
        return None

    model_name = os.getenv("OPENROUTER_MODEL_NAME", "meta-llama/llama-3-8b-instruct")

    try:
        logger.info(f"OpenRouter — calling {model_name}")
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            timeout=TIMEOUT_SECONDS,
        )

        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.85,
            max_tokens=4096,
        )

        text = response.choices[0].message.content
        if text:
            logger.info("OpenRouter — success")
            return text.strip()
        else:
            logger.warning("OpenRouter — empty response")
            return None

    except Exception as e:
        logger.error(f"OpenRouter — failed: {e}")
        return None


# ──────────────────────────────────────────────
# Main Entry Point — Level 2 provider failover
# ──────────────────────────────────────────────

PROVIDER_MAP = {
    "gemini": call_gemini,
    "openai": call_openai,
    "grok": call_grok,
    "openrouter": call_openrouter,
}


async def generate_ai_response(prompt: str) -> str:
    """
    Try each provider in AI_PROVIDERS order.
    Returns the first successful response.
    Raises Exception if ALL providers fail.
    """
    providers = _get_provider_order()
    errors: List[str] = []

    for provider_name in providers:
        call_fn = PROVIDER_MAP.get(provider_name)
        if not call_fn:
            logger.warning(f"Unknown provider '{provider_name}', skipping")
            continue

        logger.info(f"━━━ Trying provider: {provider_name.upper()} ━━━")
        result = await call_fn(prompt)

        if result:
            return result

        errors.append(provider_name)
        logger.warning(f"Provider {provider_name.upper()} failed, moving to next...")

    raise Exception(
        f"All AI providers failed: {', '.join(errors)}. "
        "Check API keys and provider availability."
    )
