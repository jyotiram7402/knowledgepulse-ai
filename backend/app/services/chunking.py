import re

from ..config import get_settings

settings = get_settings()
_WS = re.compile(r"\s+")


def _break_point(text: str, start: int, end: int) -> int:
    for i in range(end - 1, start - 1, -1):
        if text[i] in ".!?\n":
            return i + 1
    for i in range(end - 1, start - 1, -1):
        if text[i] == " ":
            return i + 1
    return end


def chunk(text: str) -> list[str]:
    if not text:
        return []
    normalized = _WS.sub(" ", text).strip()
    if not normalized:
        return []

    size = settings.chunk_size if settings.chunk_size > 0 else 900
    overlap = max(0, min(settings.chunk_overlap, size - 1))

    chunks: list[str] = []
    length = len(normalized)
    start = 0
    while start < length:
        end = min(start + size, length)
        if end < length:
            bp = _break_point(normalized, start + size // 2, end)
            if bp > start:
                end = bp
        piece = normalized[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= length:
            break
        start = max(end - overlap, start + 1)
    return chunks
