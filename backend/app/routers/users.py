from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import UpdateProfileIn, UserOut
from ..security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


def _out(user: User) -> UserOut:
    return UserOut(
        id=user.id, name=user.name, email=user.email,
        roles=user.role_names, enabled=user.enabled, created_at=user.created_at,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _out(user)


@router.put("/me", response_model=UserOut)
def update_me(body: UpdateProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.name and body.name.strip():
        user.name = body.name.strip()
    if body.new_password:
        if not body.current_password or not verify_password(body.current_password, user.password):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
        if len(body.new_password) < 8:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "New password must be at least 8 characters")
        user.password = hash_password(body.new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _out(user)
