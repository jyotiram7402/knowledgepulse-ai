import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import ChatMessage, ChatSession, User
from ..schemas import ChatMessageOut, ChatSessionOut, CreateSessionIn, SendMessageIn
from ..services import rag

router = APIRouter(prefix="/chat", tags=["chat"])


def _session_out(s: ChatSession) -> ChatSessionOut:
    return ChatSessionOut(id=s.id, title=s.title, created_at=s.created_at, updated_at=s.updated_at)


def _message_out(m: ChatMessage) -> ChatMessageOut:
    citations = json.loads(m.citations) if m.citations else []
    return ChatMessageOut(
        id=m.id, role=m.role, content=m.content, citations=citations, created_at=m.created_at,
    )


def _get_session(db: Session, user: User, session_id: UUID) -> ChatSession:
    s = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.owner_id == user.id))
    if s is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat session not found")
    return s


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(ChatSession).where(ChatSession.owner_id == user.id).order_by(ChatSession.updated_at.desc())
    ).all()
    return [_session_out(s) for s in rows]


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(body: CreateSessionIn | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = (body.title.strip() if body and body.title else "") or "New Chat"
    s = ChatSession(owner_id=user.id, title=title[:200])
    db.add(s)
    db.commit()
    db.refresh(s)
    return _session_out(s)


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def list_messages(session_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_session(db, user, session_id)
    rows = db.scalars(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc())
    ).all()
    return [_message_out(m) for m in rows]


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageOut)
def send_message(session_id: UUID, body: SendMessageIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = _get_session(db, user, session_id)
    question = body.content.strip()

    history = db.scalars(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc())
    ).all()

    db.add(ChatMessage(session_id=s.id, role="USER", content=question))
    db.flush()

    text, citations = rag.answer(db, user, history, question)

    bot = ChatMessage(session_id=s.id, role="ASSISTANT", content=text, citations=json.dumps(citations))
    db.add(bot)

    if s.title == "New Chat":
        s.title = (question[:57] + "...") if len(question) > 60 else question

    db.commit()
    db.refresh(bot)
    return _message_out(bot)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = _get_session(db, user, session_id)
    db.delete(s)  # messages cascade via FK
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
