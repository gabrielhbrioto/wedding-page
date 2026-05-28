from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from app.models.enums import InviteType, MemberStatus


class MemberConfirmation(BaseModel):
    member_id: uuid.UUID
    status: MemberStatus


class RSVPRequest(BaseModel):
    message: str | None = None
    members: list[MemberConfirmation] = Field(default_factory=list)


class OpenRsvpRequest(BaseModel):
    guest_names: list[str] = Field(default_factory=list)
    message: str | None = None


class PublicInviteMemberResponse(BaseModel):
    id: uuid.UUID
    name: str


class PublicInviteResponse(BaseModel):
    token: str
    group_name: str
    type: InviteType
    members: list[PublicInviteMemberResponse]


class PublicRsvpResponse(BaseModel):
    success: bool
    token: str
    response_id: uuid.UUID
    total_confirmados: int


class OpenRsvpResponse(BaseModel):
    success: bool
    token: str
    response_id: uuid.UUID
    total_confirmados: int
    confirmation_deadline_at: datetime | None = None


class AdminRsvpListItemResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    nome_grupo: str
    mensagem: str | None = None
    total_confirmados: int | None = None
    created_at: datetime
    updated_at: datetime


class AdminRsvpMemberStatusResponse(BaseModel):
    member_id: uuid.UUID
    member_name: str
    status: MemberStatus


class CeremonyGuestNameResponse(BaseModel):
    id: uuid.UUID
    nome: str


class AdminRsvpDetailResponse(AdminRsvpListItemResponse):
    members: list[AdminRsvpMemberStatusResponse]
    ceremony_guest_names: list[CeremonyGuestNameResponse]


class ResetRsvpResponse(BaseModel):
    reset: bool
    id: uuid.UUID
    group_id: uuid.UUID
