from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_admin
from ..models import ChatMessage, ChatSession, Document, DocumentChunk, User
from ..schemas import AdminDocumentOut, AdminStatsOut, UserOut

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/stats", response_model=AdminStatsOut)
def stats(db: Session = Depends(get_db)):
    def count(model, *where):
        stmt = select(func.count()).select_from(model)
        for w in where:
            stmt = stmt.where(w)
        return db.scalar(stmt) or 0

    return AdminStatsOut(
        total_users=count(User),
        active_users=count(User, User.enabled.is_(True)),
        total_documents=count(Document),
        total_chunks=count(DocumentChunk),
        total_sessions=count(ChatSession),
        total_messages=count(ChatMessage),
    )


@router.get("/users", response_model=list[UserOut])
def users(db: Session = Depends(get_db)):
    rows = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [
        UserOut(id=u.id, name=u.name, email=u.email, roles=u.role_names, enabled=u.enabled, created_at=u.created_at)
        for u in rows
    ]


@router.get("/documents", response_model=list[AdminDocumentOut])
def documents(db: Session = Depends(get_db)):
    rows = db.scalars(select(Document).order_by(Document.created_at.desc())).all()
    return [
        AdminDocumentOut(
            id=d.id, filename=d.filename, content_type=d.content_type, file_size=d.file_size,
            status=d.status, chunk_count=d.chunk_count, owner_id=d.owner.id,
            owner_name=d.owner.name, owner_email=d.owner.email, created_at=d.created_at,
        )
        for d in rows
    ]
