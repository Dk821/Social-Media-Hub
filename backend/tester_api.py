"""
AI API Key Tester — Production Version
Checks all configured AI providers & supports multi-key testing
Usage: python tester_api.py
"""

import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load .env
load_dotenv(Path(__file__).parent / ".env")

# Terminal Colors
G = "\033[92m"  # Green
R = "\033[91m"  # Red
Y = "\033[93m"  # Yellow
B = "\033[1m"   # Bold
X = "\033[0m"   # Reset


# ---------------------------------------
# Utility: Error Classification
# ---------------------------------------
def classify_error(e: Exception) -> str:
    msg = str(e).lower()

    if "rate limit" in msg or "429" in msg:
        return "RATE LIMITED"
    if "quota" in msg:
        return "QUOTA EXCEEDED"
    if "401" in msg or "unauthorized" in msg or "invalid api key" in msg:
        return "UNAUTHORIZED"
    if "model" in msg and "not found" in msg:
        return "MODEL NOT FOUND"

    return f"FAILED — {str(e)[:60]}"


# ---------------------------------------
# GEMINI
# ---------------------------------------
async def test_gemini():
    keys = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
    if not keys:
        return "NO KEY"

    try:
        import google.generativeai as genai
    except ImportError:
        return "SDK NOT INSTALLED"

    model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")

    results = []

    for i, key in enumerate(keys.split(",")):
        key = key.strip()
        if not key:
            continue

        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(model_name)

            response = await asyncio.to_thread(
                model.generate_content,
                "Say hi",
                generation_config={"max_output_tokens": 10}
            )

            if hasattr(response, "text") and response.text:
                results.append(f"Key {i+1}: WORKING")
            else:
                results.append(f"Key {i+1}: EMPTY RESPONSE")

        except Exception as e:
            results.append(f"Key {i+1}: {classify_error(e)}")

    return " | ".join(results)


# ---------------------------------------
# OPENAI
# ---------------------------------------
async def test_openai():
    keys = os.getenv("OPENAI_API_KEYS", os.getenv("OPENAI_API_KEY", ""))
    if not keys:
        return "NO KEY"

    try:
        from openai import AsyncOpenAI
    except ImportError:
        return "SDK NOT INSTALLED"

    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
    results = []

    for i, key in enumerate(keys.split(",")):
        key = key.strip()
        if not key:
            continue

        try:
            client = AsyncOpenAI(api_key=key, timeout=15)

            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": "Say hi"}],
                max_tokens=10,
            )

            text = response.choices[0].message.content
            if text:
                results.append(f"Key {i+1}: WORKING")
            else:
                results.append(f"Key {i+1}: EMPTY")

        except Exception as e:
            results.append(f"Key {i+1}: {classify_error(e)}")

    return " | ".join(results)


# ---------------------------------------
# GROK (xAI)
# ---------------------------------------
async def test_grok():
    api_key = os.getenv("GROK_API_KEY", "")
    if not api_key:
        return "NO KEY"

    try:
        from openai import AsyncOpenAI
    except ImportError:
        return "SDK NOT INSTALLED"

    model_name = os.getenv("GROK_MODEL_NAME", "grok-3-mini")

    try:
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1",
            timeout=15
        )

        response = await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Say hi"}],
            max_tokens=10,
        )

        text = response.choices[0].message.content
        if text:
            return "WORKING"
        return "EMPTY RESPONSE"

    except Exception as e:
        return classify_error(e)


# ---------------------------------------
# OPENROUTER
# ---------------------------------------
async def test_openrouter():
    keys = os.getenv("OPENROUTER_API_KEYS", os.getenv("OPENROUTER_API_KEY", ""))
    if not keys:
        return "NO KEY"

    try:
        from openai import AsyncOpenAI
    except ImportError:
        return "SDK NOT INSTALLED"

    model_name = os.getenv(
        "OPENROUTER_MODEL_NAME",
        "meta-llama/llama-3-8b-instruct"
    )

    results = []

    for i, key in enumerate(keys.split(",")):
        key = key.strip()
        if not key:
            continue

        try:
            client = AsyncOpenAI(
                api_key=key,
                base_url="https://openrouter.ai/api/v1",
                timeout=15
            )

            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": "Say hi"}],
                max_tokens=10,
            )

            text = response.choices[0].message.content
            if text:
                results.append(f"Key {i+1}: WORKING")
            else:
                results.append(f"Key {i+1}: EMPTY")

        except Exception as e:
            results.append(f"Key {i+1}: {classify_error(e)}")

    return " | ".join(results)


# ---------------------------------------
# MAIN
# ---------------------------------------
async def main():
    print(f"\n{B}══════════════════════════════════════{X}")
    print(f"{B}      AI API Key Health Checker{X}")
    print(f"{B}══════════════════════════════════════{X}\n")

    providers = [
        ("GEMINI", test_gemini),
        ("OPENAI", test_openai),
        ("GROK", test_grok),
        ("OPENROUTER", test_openrouter),
    ]

    # Run in parallel
    tasks = [test_fn() for _, test_fn in providers]
    results = await asyncio.gather(*tasks)

    for (name, _), result in zip(providers, results):
        print(f"  Testing {B}{name}{X}...", end=" ")

        if result == "NO KEY":
            print(f"{Y}⚠  NO KEY{X}")
        elif result.startswith("Key") or result == "WORKING":
            print(f"{G}✅ {result}{X}")
        else:
            print(f"{R}❌ {result}{X}")

    print(f"\n{B}══════════════════════════════════════{X}\n")


if __name__ == "__main__":
    asyncio.run(main())