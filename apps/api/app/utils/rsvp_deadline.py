from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event_setting import EventSetting


def normalize_rsvp_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value

    return value.astimezone(timezone.utc).replace(tzinfo=None)


def compute_confirmation_deadline(
    event_date: datetime,
    offset_days: int | None,
) -> datetime | None:
    if offset_days is None:
        return None

    return normalize_rsvp_datetime(event_date) - timedelta(days=offset_days)


def is_confirmation_window_closed(
    now: datetime,
    event_date: datetime,
    offset_days: int | None,
) -> bool:
    deadline = compute_confirmation_deadline(event_date, offset_days)
    if deadline is None:
        return False

    return normalize_rsvp_datetime(now) >= deadline


def get_current_event_setting(db: Session) -> EventSetting:
    event = db.scalar(select(EventSetting).order_by(EventSetting.created_at.asc()).limit(1))

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracoes do evento nao encontradas.",
        )

    return event


def ensure_confirmation_window_open(db: Session) -> EventSetting:
    event = get_current_event_setting(db)

    if is_confirmation_window_closed(
        datetime.now(timezone.utc),
        event.data_evento,
        event.rsvp_deadline_offset_days,
    ):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Prazo de confirmacao encerrado.",
        )

    return event


def serialize_event_setting(event: EventSetting) -> dict[str, Any]:
    return {
        "id": event.id,
        "nome_casal": event.nome_casal,
        "data_evento": event.data_evento,
        "rsvp_deadline_offset_days": event.rsvp_deadline_offset_days,
        "confirmation_deadline_at": compute_confirmation_deadline(
            event.data_evento,
            event.rsvp_deadline_offset_days,
        ),
        "local_nome": event.local_nome,
        "endereco": event.endereco,
        "google_maps_url": event.google_maps_url,
        "gift_list_url": event.gift_list_url,
        "mensagem_home": event.mensagem_home,
        "ativo": event.ativo,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
    }