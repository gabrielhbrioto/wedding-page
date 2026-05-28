import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.gallery import (
    UploadGalleryPhotoRequest,
    UploadGalleryPhotoResponse,
)
from app.schemas.groups import DeleteEntityResponse

router = APIRouter(dependencies=[Depends(require_admin)])


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    response_model=UploadGalleryPhotoResponse,
)
def upload_gallery_photo(
    payload: UploadGalleryPhotoRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    row = db.execute(
        text(
            """
            insert into gallery_photos (
                titulo,
                imagem_url,
                publico,
                ordem,
                created_by,
                updated_by
            )
            values (
                :titulo,
                :imagem_url,
                :publico,
                :ordem,
                :created_by,
                :updated_by
            )
            returning
                id,
                titulo,
                imagem_url,
                publico,
                ordem,
                created_at
            """
        ),
        {
            "titulo": payload.titulo,
            "imagem_url": payload.imagem_url,
            "publico": payload.publico,
            "ordem": payload.ordem,
            "created_by": current_admin.id,
            "updated_by": current_admin.id,
        },
    ).mappings().one()
    db.commit()

    return {
        "uploaded": True,
        "photo": row,
    }


@router.delete("/{photo_id}", response_model=DeleteEntityResponse)
def delete_gallery_photo(photo_id: uuid.UUID, db: Session = Depends(get_db)):
    result = db.execute(
        text("delete from gallery_photos where id = :photo_id"),
        {"photo_id": photo_id},
    )

    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto nao encontrada.",
        )

    db.commit()
    return {
        "deleted": True,
        "id": str(photo_id),
    }
