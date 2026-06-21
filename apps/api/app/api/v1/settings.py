from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.event_setting import EventSetting
from app.schemas.settings import (
    DeleteEventSettingsResponse,
    EventSettingsResponse,
    UpdateEventSettingsRequest,
    UpsertEventSettingsResponse,
)
from app.utils.rsvp_deadline import serialize_event_setting


router = APIRouter(dependencies=[Depends(require_admin)])


def _get_current_event(db: Session) -> EventSetting | None:
    return db.scalar(select(EventSetting).order_by(EventSetting.created_at.asc()).limit(1))


def _apply_payload(event: EventSetting, payload: UpdateEventSettingsRequest) -> EventSetting:
    if payload.nome_casal is not None:
        event.nome_casal = payload.nome_casal
    if payload.data_evento is not None:
        event.data_evento = payload.data_evento
    if "rsvp_deadline_offset_days" in payload.model_fields_set:
        event.rsvp_deadline_offset_days = payload.rsvp_deadline_offset_days
    if payload.local_nome is not None:
        event.local_nome = payload.local_nome
    if payload.endereco is not None:
        event.endereco = payload.endereco
    if payload.google_maps_url is not None:
        event.google_maps_url = payload.google_maps_url
    if "gift_list_url" in payload.model_fields_set:
        event.gift_list_url = payload.gift_list_url
    if payload.mensagem_home is not None:
        event.mensagem_home = payload.mensagem_home
    if payload.ativo is not None:
        event.ativo = payload.ativo

    return event


@router.get("", response_model=EventSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    event = _get_current_event(db)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracoes do evento nao encontradas.",
        )

    return serialize_event_setting(event)


@router.post("", response_model=UpsertEventSettingsResponse)
def create_settings(
    payload: UpdateEventSettingsRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    if _get_current_event(db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Configuracoes do evento ja existem.",
        )

    if not payload.nome_casal or not payload.data_evento:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para criar configuracoes iniciais, informe nome_casal e data_evento.",
        )

    event = EventSetting(
        nome_casal=payload.nome_casal,
        data_evento=payload.data_evento,
        rsvp_deadline_offset_days=payload.rsvp_deadline_offset_days,
        local_nome=payload.local_nome,
        endereco=payload.endereco,
        google_maps_url=payload.google_maps_url,
        gift_list_url=payload.gift_list_url,
        mensagem_home=payload.mensagem_home,
        ativo=payload.ativo if payload.ativo is not None else True,
        created_by=current_admin.id,
        updated_by=current_admin.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "created": True,
        "settings": serialize_event_setting(event),
    }


@router.put("", response_model=UpsertEventSettingsResponse)
def update_settings(
    payload: UpdateEventSettingsRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    event = _get_current_event(db)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracoes do evento nao encontradas.",
        )

    _apply_payload(event, payload)
    event.updated_by = current_admin.id

    db.commit()
    db.refresh(event)

    return {
        "updated": True,
        "settings": serialize_event_setting(event),
    }


@router.delete("", response_model=DeleteEventSettingsResponse)
def delete_settings(db: Session = Depends(get_db)):
    event = _get_current_event(db)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracoes do evento nao encontradas.",
        )

    event_id = event.id
    db.delete(event)
    db.commit()

    return DeleteEventSettingsResponse(deleted=True, id=event_id)
