import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.gift import Gift
from app.schemas.gifts import CreateGiftRequest, GiftResponse, UpdateGiftRequest
from app.schemas.groups import DeleteEntityResponse

router = APIRouter(dependencies=[Depends(require_admin)])


def _to_gift_response(gift: Gift) -> GiftResponse:
    return GiftResponse(
        id=gift.id,
        nome=gift.nome,
        descricao=gift.descricao,
        preco=gift.preco,
        link_externo=gift.link_externo,
        imagem_url=gift.imagem_url,
        ativo=gift.ativo,
        ordem=gift.ordem,
        created_at=gift.created_at,
    )


@router.get("", response_model=list[GiftResponse])
def list_gifts(db: Session = Depends(get_db)):
    gifts = db.scalars(
        select(Gift).order_by(Gift.ordem.asc(), Gift.created_at.desc())
    ).all()
    return [_to_gift_response(gift) for gift in gifts]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GiftResponse)
def create_gift(
    payload: CreateGiftRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    gift = Gift(
        nome=payload.nome,
        descricao=payload.descricao,
        preco=payload.preco,
        link_externo=payload.link_externo,
        imagem_url=payload.imagem_url,
        ativo=payload.ativo,
        ordem=payload.ordem,
        created_by=current_admin.id,
        updated_by=current_admin.id,
    )

    db.add(gift)
    db.commit()
    db.refresh(gift)
    return _to_gift_response(gift)


@router.put("/{gift_id}", response_model=GiftResponse)
def update_gift(
    gift_id: uuid.UUID,
    payload: UpdateGiftRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    gift = db.get(Gift, gift_id)
    if not gift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presente nao encontrado.",
        )

    if payload.nome is not None:
        gift.nome = payload.nome
    if payload.descricao is not None:
        gift.descricao = payload.descricao
    if payload.preco is not None:
        gift.preco = payload.preco
    if payload.link_externo is not None:
        gift.link_externo = payload.link_externo
    if payload.imagem_url is not None:
        gift.imagem_url = payload.imagem_url
    if payload.ativo is not None:
        gift.ativo = payload.ativo
    if payload.ordem is not None:
        gift.ordem = payload.ordem

    gift.updated_by = current_admin.id

    db.commit()
    db.refresh(gift)
    return _to_gift_response(gift)


@router.delete("/{gift_id}", response_model=DeleteEntityResponse)
def delete_gift(gift_id: uuid.UUID, db: Session = Depends(get_db)):
    gift = db.get(Gift, gift_id)
    if not gift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presente nao encontrado.",
        )

    db.delete(gift)
    db.commit()
    return DeleteEntityResponse(deleted=True, id=gift_id)
