import httpx
from fastapi import HTTPException, status

from ..config import get_settings

settings = get_settings()
_TIMEOUT = httpx.Timeout(60.0, connect=15.0)


def embed(text: str) -> list[float]:
    if not text or not text.strip():
        return [0.0] * settings.embedding_dimensions
    model = settings.gemini_embedding_model
    url = f"{settings.gemini_base_url}/models/{model}:embedContent?key={settings.gemini_api_key}"
    body = {
        "model": f"models/{model}",
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": settings.embedding_dimensions,
    }
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            r = client.post(url, json=body)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Embedding service error: {e.response.text[:300]}")
    except httpx.HTTPError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Embedding service error: {e}")

    values = data.get("embedding", {}).get("values")
    if not values:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Embedding response missing values")
    return [float(v) for v in values]


def chat(turns: list[dict], system_instruction: str) -> str:
    """turns: [{"role": "user"|"model", "text": "..."}]"""
    model = settings.gemini_chat_model
    url = f"{settings.gemini_base_url}/models/{model}:generateContent?key={settings.gemini_api_key}"
    body = {
        "contents": [{"role": t["role"], "parts": [{"text": t["text"]}]} for t in turns],
        "generationConfig": {"temperature": 0.2, "topP": 0.9, "maxOutputTokens": 1024},
    }
    if system_instruction:
        body["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            r = client.post(url, json=body)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Chat service error: {e.response.text[:300]}")
    except httpx.HTTPError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Chat service error: {e}")

    candidates = data.get("candidates")
    if not candidates:
        reason = data.get("promptFeedback", {}).get("blockReason", "unknown")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Gemini returned no candidates ({reason})")
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts).strip()
