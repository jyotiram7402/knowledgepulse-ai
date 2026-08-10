from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ---------- requests ----------
class RegisterIn(CamelModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class LoginIn(CamelModel):
    email: EmailStr
    password: str


class UpdateProfileIn(CamelModel):
    name: str | None = None
    current_password: str | None = None
    new_password: str | None = None


class CreateSessionIn(CamelModel):
    title: str | None = None


class SendMessageIn(CamelModel):
    content: str = Field(min_length=1, max_length=4000)


# ---------- responses ----------
class UserOut(CamelModel):
    id: UUID
    name: str
    email: str
    roles: list[str]
    enabled: bool
    created_at: datetime


class AuthOut(CamelModel):
    token: str
    user: UserOut


class DocumentOut(CamelModel):
    id: UUID
    filename: str
    content_type: str
    file_size: int
    url: str | None = None
    status: str
    chunk_count: int
    error_message: str | None = None
    created_at: datetime


class PageOut(CamelModel):
    content: list[DocumentOut]
    total_pages: int
    total_elements: int
    size: int
    number: int
    first: bool
    last: bool


class ChatSessionOut(CamelModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class CitationOut(CamelModel):
    marker: int
    chunk_id: str
    document_id: str
    chunk_index: int
    similarity: float
    snippet: str


class ChatMessageOut(CamelModel):
    id: UUID
    role: str
    content: str
    citations: list[CitationOut] = []
    created_at: datetime


class AdminStatsOut(CamelModel):
    total_users: int
    active_users: int
    total_documents: int
    total_chunks: int
    total_sessions: int
    total_messages: int


class AdminDocumentOut(CamelModel):
    id: UUID
    filename: str
    content_type: str
    file_size: int
    status: str
    chunk_count: int
    owner_id: UUID
    owner_name: str
    owner_email: str
    created_at: datetime
