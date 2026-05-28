from datetime import datetime
import uuid

from pydantic import BaseModel, Field


class GalleryPhotoResponse(BaseModel):
    id: uuid.UUID
    titulo: str | None = None
    imagem_url: str
    publico: bool | None = None
    ordem: int | None = None
    created_at: datetime | None = None


class UploadGalleryPhotoRequest(BaseModel):
    titulo: str | None = Field(default=None, max_length=200)
    imagem_url: str = Field(min_length=1)
    publico: bool = True
    ordem: int = 0


class UploadGalleryPhotoResponse(BaseModel):
    uploaded: bool
    photo: GalleryPhotoResponse
