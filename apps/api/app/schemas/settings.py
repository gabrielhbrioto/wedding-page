from datetime import datetime
import uuid
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator


def _validate_http_url(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL invalida. Use um link http:// ou https://")

    return normalized


class EventSettingsResponse(BaseModel):
    id: uuid.UUID
    nome_casal: str
    data_evento: datetime
    rsvp_deadline_offset_days: int | None = None
    confirmation_deadline_at: datetime | None = None
    local_nome: str | None = None
    endereco: str | None = None
    google_maps_url: str | None = None
    gift_list_url: str | None = None
    mensagem_home: str | None = None
    ativo: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UpdateEventSettingsRequest(BaseModel):
    nome_casal: str | None = Field(default=None, max_length=200)
    data_evento: datetime | None = None
    rsvp_deadline_offset_days: int | None = Field(default=None, ge=0)
    local_nome: str | None = Field(default=None, max_length=200)
    endereco: str | None = None
    google_maps_url: str | None = None
    gift_list_url: str | None = None
    mensagem_home: str | None = None
    ativo: bool | None = None

    @field_validator("google_maps_url", "gift_list_url")
    @classmethod
    def validate_urls(cls, value: str | None) -> str | None:
        return _validate_http_url(value)


class UpsertEventSettingsResponse(BaseModel):
    created: bool | None = None
    updated: bool | None = None
    settings: EventSettingsResponse


class DeleteEventSettingsResponse(BaseModel):
    deleted: bool
    id: uuid.UUID
