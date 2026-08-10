from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import ChatMessage, DocumentChunk
from . import gemini

settings = get_settings()

SYSTEM_INSTRUCTION = (
    "You are KnowledgePulse AI, an enterprise knowledge assistant. "
    "Answer ONLY using the provided context snippets. "
    "If the answer cannot be found in the context, say: "
    '"I could not find that information in your knowledge base." '
    "Use only the [n] citation markers shown. Be concise, factual, and professional."
)


def _snippet(content: str) -> str:
    t = " ".join(content.split())
    return t if len(t) <= 240 else t[:240] + "..."


def answer(db: Session, owner, history: list[ChatMessage], question: str) -> tuple[str, list[dict]]:
    query_vec = gemini.embed(question)

    distance = DocumentChunk.embedding.cosine_distance(query_vec).label("distance")
    rows = db.execute(
        select(DocumentChunk, distance)
        .where(DocumentChunk.owner_id == owner.id, DocumentChunk.embedding.isnot(None))
        .order_by(distance)
        .limit(settings.top_k)
    ).all()

    citations: list[dict] = []
    context_parts: list[str] = []
    idx = 1
    for chunk_row, dist in rows:
        similarity = 1.0 - float(dist)
        if similarity < settings.similarity_threshold and citations:
            continue
        context_parts.append(f"[{idx}] {chunk_row.content}")
        citations.append({
            "marker": idx,
            "chunk_id": str(chunk_row.id),
            "document_id": str(chunk_row.document_id),
            "chunk_index": chunk_row.chunk_index,
            "similarity": round(similarity, 4),
            "snippet": _snippet(chunk_row.content),
        })
        idx += 1

    if not citations:
        prompt = (
            "The user's knowledge base contains no relevant context for this question.\n"
            "Politely tell them no relevant information was found.\n\nQuestion: " + question
        )
    else:
        prompt = "Context snippets:\n\n" + "\n\n".join(context_parts) + "\n\nQuestion: " + question

    turns: list[dict] = []
    for m in history:
        turns.append({"role": "user" if m.role == "USER" else "model", "text": m.content})
    turns.append({"role": "user", "text": prompt})

    text = gemini.chat(turns, SYSTEM_INSTRUCTION)
    return text, citations
