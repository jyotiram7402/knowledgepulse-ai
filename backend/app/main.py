import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .config import get_settings
from .database import SessionLocal
from .models import Role, User
from .routers import admin, auth, chat, documents, users
from .security import hash_password

settings = get_settings()
log = logging.getLogger("knowledgepulse")
logging.basicConfig(level=logging.INFO)


def bootstrap() -> None:
    """Seed roles and the admin user on startup (idempotent)."""
    db = SessionLocal()
    try:
        for name in ("ROLE_USER", "ROLE_ADMIN"):
            if db.scalar(select(Role).where(Role.name == name)) is None:
                db.add(Role(name=name))
        db.commit()

        email = (settings.admin_email or "").strip().lower()
        pwd = settings.admin_password or ""
        if email and pwd and db.scalar(select(User).where(User.email == email)) is None:
            admin_role = db.scalar(select(Role).where(Role.name == "ROLE_ADMIN"))
            user_role = db.scalar(select(Role).where(Role.name == "ROLE_USER"))
            db.add(User(
                name="Administrator", email=email, password=hash_password(pwd),
                enabled=True, roles=[admin_role, user_role],
            ))
            db.commit()
            log.info("Bootstrapped admin user %s", email)
    except Exception:
        db.rollback()
        log.exception("Bootstrap failed (is the schema applied?)")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    bootstrap()
    yield


app = FastAPI(title="KnowledgePulse AI (Python)", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api/v1")
api.include_router(auth.router)
api.include_router(users.router)
api.include_router(documents.router)
api.include_router(chat.router)
api.include_router(admin.router)


@api.get("/actuator/health", tags=["health"])
def health():
    return {"status": "UP"}


app.include_router(api)


@app.get("/", tags=["health"])
def root():
    return {"service": "knowledgepulse-python", "status": "UP", "docs": "/docs"}
