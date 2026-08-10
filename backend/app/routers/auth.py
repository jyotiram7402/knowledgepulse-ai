from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Role, User
from ..schemas import AuthOut, LoginIn, RegisterIn, UserOut
from ..security import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    exists = db.scalar(select(func.count()).select_from(User).where(func.lower(User.email) == email))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user_role = db.scalar(select(Role).where(Role.name == "ROLE_USER"))
    if user_role is None:
        user_role = Role(name="ROLE_USER")
        db.add(user_role)
        db.flush()

    user = User(
        name=body.name.strip(),
        email=email,
        password=hash_password(body.password),
        enabled=True,
        roles=[user_role],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthOut(token=create_token(user), user=_user_out(user))


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None or not verify_password(body.password, user.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.enabled:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is disabled")
    return AuthOut(token=create_token(user), user=_user_out(user))


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id, name=user.name, email=user.email,
        roles=user.role_names, enabled=user.enabled, created_at=user.created_at,
    )
