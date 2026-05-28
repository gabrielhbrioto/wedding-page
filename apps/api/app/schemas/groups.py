from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from app.models.enums import InviteType, MemberStatus, RsvpStatus


class GroupMemberResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    nome: str
    status: MemberStatus | None = None
    pre_cadastrado: bool
    ordem_exibicao: int | None = None
    created_at: datetime


class GroupResponse(BaseModel):
    id: uuid.UUID
    token: str | None = None
    nome_grupo: str
    tipo_convite: InviteType
    observacoes: str | None = None
    rsvp_status: RsvpStatus
    responded_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class GroupDetailResponse(GroupResponse):
    members: list[GroupMemberResponse]


class CreateGroupRequest(BaseModel):
    token: str | None = Field(default=None, max_length=30)
    nome_grupo: str = Field(min_length=1, max_length=150)
    tipo_convite: InviteType = InviteType.CERIMONIA_JANTAR
    observacoes: str | None = None


class UpdateGroupRequest(BaseModel):
    token: str | None = Field(default=None, max_length=30)
    nome_grupo: str | None = Field(default=None, max_length=150)
    tipo_convite: InviteType | None = None
    observacoes: str | None = None
    rsvp_status: RsvpStatus | None = None
    responded_at: datetime | None = None


class CreateGroupMemberRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    pre_cadastrado: bool = True
    ordem_exibicao: int = 0


class CreateGroupMemberResponse(BaseModel):
    created: bool
    group_id: uuid.UUID
    member: GroupMemberResponse


class DeleteEntityResponse(BaseModel):
    deleted: bool
    id: uuid.UUID
