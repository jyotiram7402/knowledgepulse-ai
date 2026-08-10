from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import get_current_user
from ..models import Document, DocumentChunk, User
from ..schemas import DocumentOut, PageOut
from ..services import chunking, cloudinary_service, extraction, gemini

settings = get_settings()
router = APIRouter(prefix="/documents", tags=["documents"])

MAX_BYTES = 20 * 1024 * 1024
ALLOWED = (".pdf", ".docx", ".txt", ".md")


def _out(d: Document) -> DocumentOut:
    return DocumentOut(
        id=d.id, filename=d.filename, content_type=d.content_type, file_size=d.file_size,
        url=d.cloudinary_url, status=d.status, chunk_count=d.chunk_count,
        error_message=d.error_message, created_at=d.created_at,
    )


@router.post("", response_model=DocumentOut)
def upload(file: UploadFile, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = file.file.read()
    name = (file.filename or "untitled").strip()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is required")
    if len(data) > MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File exceeds 20MB limit")
    if not name.lower().endswith(ALLOWED):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Allowed file types: PDF, DOCX, TXT, MD")

    text = extraction.extract(data, name, file.content_type or "")
    if not text or not text.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No text content could be extracted from this file")

    url, public_id = cloudinary_service.upload(data, user.id, name)

    doc = Document(
        owner_id=user.id, filename=name, content_type=file.content_type or "application/octet-stream",
        file_size=len(data), cloudinary_url=url, cloudinary_public_id=public_id,
        status="PROCESSING", chunk_count=0,
    )
    db.add(doc)
    db.flush()

    try:
        pieces = chunking.chunk(text)
        for i, piece in enumerate(pieces):
            vec = gemini.embed(piece)
            db.add(DocumentChunk(
                document_id=doc.id, owner_id=user.id, chunk_index=i,
                content=piece, token_count=max(1, len(piece) // 4), embedding=vec,
            ))
        doc.chunk_count = len(pieces)
        doc.status = "READY"
    except HTTPException as e:
        doc.status = "FAILED"
        doc.error_message = str(e.detail)[:1000]
    except Exception as e:
        doc.status = "FAILED"
        doc.error_message = str(e)[:1000]

    db.commit()
    db.refresh(doc)
    return _out(doc)


@router.get("", response_model=PageOut)
def list_docs(
    page: int = Query(0, ge=0), size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count()).select_from(Document).where(Document.owner_id == user.id)) or 0
    rows = db.scalars(
        select(Document).where(Document.owner_id == user.id)
        .order_by(Document.created_at.desc()).offset(page * size).limit(size)
    ).all()
    total_pages = (total + size - 1) // size if size else 0
    return PageOut(
        content=[_out(d) for d in rows], total_pages=total_pages, total_elements=total,
        size=size, number=page, first=(page == 0), last=(page >= total_pages - 1 if total_pages else True),
    )


@router.get("/search", response_model=list[DocumentOut])
def search(q: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Document).where(Document.owner_id == user.id)
    if q and q.strip():
        stmt = stmt.where(func.lower(Document.filename).like(f"%{q.strip().lower()}%"))
    rows = db.scalars(stmt.order_by(Document.created_at.desc())).all()
    return [_out(d) for d in rows]


@router.get("/{doc_id}", response_model=DocumentOut)
def get_doc(doc_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.scalar(select(Document).where(Document.id == doc_id, Document.owner_id == user.id))
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return _out(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doc(doc_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.scalar(select(Document).where(Document.id == doc_id, Document.owner_id == user.id))
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    cloudinary_service.delete(doc.cloudinary_public_id)
    db.delete(doc)  # chunks cascade via FK
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
