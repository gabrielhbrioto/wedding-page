from datetime import datetime, timezone
from typing import Any
import re
import unicodedata
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import InviteType, MemberStatus, RsvpStatus
from app.models.group_member import GroupMember
from app.models.event_setting import EventSetting
from app.models.invitation_group import InvitationGroup
from app.models.rsvp_member_status import RsvpMemberStatus
from app.models.rsvp_response import RsvpResponse
from app.schemas.rsvp import (
    OpenRsvpRequest,
    OpenRsvpResponse,
    PublicInviteMemberResponse,
    PublicInviteResponse,
    PublicRsvpResponse,
    RSVPRequest,
)
from app.schemas.settings import EventSettingsResponse
from app.utils.rsvp_deadline import (
    compute_confirmation_deadline,
    ensure_confirmation_window_open,
    serialize_event_setting,
)

router = APIRouter()

SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _get_group_by_token(db: Session, token: str) -> InvitationGroup:
    group = db.scalar(select(InvitationGroup).where(InvitationGroup.token == token))

    if not group:
        raise HTTPException(status_code=404, detail="Convite nao encontrado.")

    return group


def _get_group_members(db: Session, group_id) -> list[GroupMember]:
    return list(
        db.scalars(
            select(GroupMember)
            .where(GroupMember.group_id == group_id)
            .order_by(GroupMember.ordem_exibicao.asc(), GroupMember.nome.asc())
        ).all()
    )


def _allowed_member_statuses(group: InvitationGroup) -> set[MemberStatus]:
    if group.tipo_convite == InviteType.CERIMONIA:
        return {MemberStatus.SOMENTE_CERIMONIA, MemberStatus.AUSENTE}

    return {
        MemberStatus.CERIMONIA_E_JANTAR,
        MemberStatus.SOMENTE_CERIMONIA,
        MemberStatus.AUSENTE,
    }


def _normalize_guest_names(guest_names: list[str]) -> list[str]:
    return [guest_name.strip() for guest_name in guest_names if guest_name and guest_name.strip()]


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(
        character for character in normalized if not unicodedata.combining(character)
    )
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def _build_open_group_name(guest_names: list[str]) -> str:
    display_names = guest_names[:3]
    if len(guest_names) > 3:
        display_names = [*display_names, "e outros"]

    return f"Cerimônia - {', '.join(display_names)}"


def _build_open_token(db: Session, guest_names: list[str]) -> str:
    base = _slugify("-".join(guest_names))[:21].strip("-") or "cerimonia"

    for _ in range(10):
        token = f"{base}-{uuid.uuid4().hex[:8]}"
        existing_token = db.scalar(
            select(InvitationGroup.id).where(InvitationGroup.token == token)
        )
        if not existing_token:
            return token

    raise HTTPException(
        status_code=500,
        detail="Nao foi possivel gerar um token de convite.",
    )


@router.get("/event", response_model=EventSettingsResponse)
def get_event(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retorna dados da cerimonia do banco de dados."""
    stmt = select(EventSetting).order_by(EventSetting.created_at.asc()).limit(1)
    event = db.scalar(stmt)

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Configurações do evento não encontradas. Execute o script de seed.",
        )

    return serialize_event_setting(event)


@router.get("/countdown")
def get_countdown(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retorna data do evento para contagem regressiva."""
    stmt = select(EventSetting).order_by(EventSetting.created_at.asc()).limit(1)
    event = db.scalar(stmt)

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Configurações do evento não encontradas.",
        )

    return {
        "date": event.data_evento.isoformat() if event.data_evento else None,
    }


@router.get("/invite/{token}", response_model=PublicInviteResponse)
def get_invite(token: str, db: Session = Depends(get_db)):
    group = _get_group_by_token(db, token)
    members = _get_group_members(db, group.id)

    return PublicInviteResponse(
        token=group.token or token,
        group_name=group.nome_grupo,
        type=group.tipo_convite,
        members=[
            PublicInviteMemberResponse(id=member.id, name=member.nome)
            for member in members
        ],
    )


@router.post("/rsvp/open", response_model=OpenRsvpResponse)
def generic_rsvp(
    payload: OpenRsvpRequest,
    db: Session = Depends(get_db),
):
    event = ensure_confirmation_window_open(db)
    guest_names = _normalize_guest_names(payload.guest_names)

    if not guest_names:
        raise HTTPException(
            status_code=400,
            detail="Informe ao menos um nome para confirmar a presença.",
        )

    token = _build_open_token(db, guest_names)
    group = InvitationGroup(
        token=token,
        nome_grupo=_build_open_group_name(guest_names),
        tipo_convite=InviteType.CERIMONIA,
        observacoes=None,
        rsvp_status=RsvpStatus.RESPONDIDO,
        responded_at=datetime.now(timezone.utc),
        created_by=SYSTEM_USER_ID,
        updated_by=SYSTEM_USER_ID,
    )
    db.add(group)
    db.flush()

    members: list[GroupMember] = []
    for index, guest_name in enumerate(guest_names):
        member = GroupMember(
            group_id=group.id,
            nome=guest_name,
            pre_cadastrado=False,
            ordem_exibicao=index,
            created_by=SYSTEM_USER_ID,
            updated_by=SYSTEM_USER_ID,
        )
        members.append(member)
        db.add(member)

    db.flush()

    response = RsvpResponse(
        group_id=group.id,
        mensagem=payload.message,
        total_confirmados=len(guest_names),
        created_by=SYSTEM_USER_ID,
        updated_by=SYSTEM_USER_ID,
    )
    db.add(response)
    db.flush()

    for member in members:
        db.add(
            RsvpMemberStatus(
                response_id=response.id,
                member_id=member.id,
                status=MemberStatus.SOMENTE_CERIMONIA,
                created_by=SYSTEM_USER_ID,
                updated_by=SYSTEM_USER_ID,
            )
        )

    db.commit()
    db.refresh(response)

    return OpenRsvpResponse(
        success=True,
        token=group.token or token,
        response_id=response.id,
        total_confirmados=response.total_confirmados or 0,
        confirmation_deadline_at=compute_confirmation_deadline(
            event.data_evento,
            event.rsvp_deadline_offset_days,
        ),
    )


@router.post("/rsvp/{token}", response_model=PublicRsvpResponse)
def confirm_rsvp(
    token: str,
    payload: RSVPRequest,
    db: Session = Depends(get_db),
):
    group = _get_group_by_token(db, token)
    ensure_confirmation_window_open(db)
    group_members = _get_group_members(db, group.id)

    member_ids = {member.id for member in group_members}
    invalid_members = [
        str(member_confirmation.member_id)
        for member_confirmation in payload.members
        if member_confirmation.member_id not in member_ids
    ]

    if invalid_members:
        raise HTTPException(
            status_code=400,
            detail="Um ou mais convidados nao pertencem a este convite.",
        )

    allowed_statuses = _allowed_member_statuses(group)
    invalid_statuses = [
        member_confirmation.status.value
        for member_confirmation in payload.members
        if member_confirmation.status not in allowed_statuses
    ]

    if invalid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Um ou mais status informados nao sao validos para este convite.",
        )

    existing_response = db.scalar(
        select(RsvpResponse).where(RsvpResponse.group_id == group.id)
    )
    if existing_response:
        db.delete(existing_response)
        db.flush()

    response = RsvpResponse(
        group_id=group.id,
        mensagem=payload.message,
        total_confirmados=sum(
            1
            for member_confirmation in payload.members
            if member_confirmation.status != MemberStatus.AUSENTE
        ),
        created_by=SYSTEM_USER_ID,
        updated_by=SYSTEM_USER_ID,
    )
    db.add(response)
    db.flush()

    for member_confirmation in payload.members:
        db.add(
            RsvpMemberStatus(
                response_id=response.id,
                member_id=member_confirmation.member_id,
                status=member_confirmation.status,
                created_by=SYSTEM_USER_ID,
                updated_by=SYSTEM_USER_ID,
            )
        )

    group.rsvp_status = RsvpStatus.RESPONDIDO
    group.responded_at = datetime.now(timezone.utc)
    group.updated_by = SYSTEM_USER_ID

    db.commit()
    db.refresh(response)

    return PublicRsvpResponse(
        success=True,
        token=token,
        response_id=response.id,
        total_confirmados=response.total_confirmados or 0,
    )


@router.get("/calendar/{token}.ics")
def get_calendar(token: str):
    return {
        "token": token,
        "filename": f"invite-{token}.ics",
        "content": "BEGIN:VCALENDAR\\nVERSION:2.0\\nEND:VCALENDAR",
    }


@router.get("/gifts")
def list_public_gifts():
    return [
        {
            "id": "gift-1",
            "name": "Jogo de jantar",
            "price": 350.00,
            "available": True,
        },
        {
            "id": "gift-2",
            "name": "Air fryer",
            "price": 500.00,
            "available": True,
        },
    ]


@router.post("/gifts/{gift_id}/reserve")
def reserve_public_gift(gift_id: str):
    return {
        "reserved": True,
        "gift_id": gift_id,
    }


@router.get("/gallery")
def list_public_gallery():
    return []