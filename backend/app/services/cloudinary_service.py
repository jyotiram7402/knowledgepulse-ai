import uuid

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status

from ..config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload(data: bytes, owner_id, filename: str) -> tuple[str, str]:
    public_id = f"{settings.cloudinary_folder}/{owner_id}/{uuid.uuid4()}"
    try:
        res = cloudinary.uploader.upload(
            data,
            public_id=public_id,
            resource_type="raw",
            use_filename=True,
            unique_filename=False,
            overwrite=True,
        )
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"File upload failed: {e}")
    return res.get("secure_url"), res.get("public_id")


def delete(public_id: str | None) -> None:
    if not public_id:
        return
    try:
        cloudinary.uploader.destroy(public_id, resource_type="raw")
    except Exception:
        pass
