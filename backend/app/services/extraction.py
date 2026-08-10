import io

import docx
from fastapi import HTTPException, status
from pypdf import PdfReader


def extract(data: bytes, filename: str, content_type: str) -> str:
    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    try:
        if name.endswith(".pdf") or "pdf" in ctype:
            reader = PdfReader(io.BytesIO(data))
            return "\n".join((page.extract_text() or "") for page in reader.pages)
        if name.endswith(".docx") or "wordprocessingml" in ctype:
            d = docx.Document(io.BytesIO(data))
            return "\n".join(p.text for p in d.paragraphs)
        if name.endswith((".txt", ".md")) or ctype.startswith("text/"):
            return data.decode("utf-8", errors="ignore")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Failed to read file: {e}")

    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported file type. Allowed: PDF, DOCX, TXT, MD")
