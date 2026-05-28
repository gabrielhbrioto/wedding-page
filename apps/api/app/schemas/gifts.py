from datetime import datetime
from decimal import Decimal
import uuid

from pydantic import BaseModel, Field


class GiftResponse(BaseModel):
    id: uuid.UUID
    nome: str
    descricao: str | None = None
    preco: Decimal | None = None
    link_externo: str | None = None
    imagem_url: str | None = None
    ativo: bool | None = None
    ordem: int | None = None
    created_at: datetime | None = None


class CreateGiftRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    descricao: str | None = None
    preco: Decimal | None = None
    link_externo: str | None = None
    imagem_url: str | None = None
    ativo: bool = True
    ordem: int = 0


class UpdateGiftRequest(BaseModel):
    nome: str | None = Field(default=None, max_length=200)
    descricao: str | None = None
    preco: Decimal | None = None
    link_externo: str | None = None
    imagem_url: str | None = None
    ativo: bool | None = None
    ordem: int | None = None
