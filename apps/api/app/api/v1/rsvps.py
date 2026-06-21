import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.ceremony_guest_name import CeremonyGuestName
from app.models.enums import RsvpStatus
from app.models.group_member import GroupMember
from app.models.invitation_group import InvitationGroup
from app.models.rsvp_member_status import RsvpMemberStatus
from app.models.rsvp_response import RsvpResponse
from app.schemas.rsvp import (
    AdminRsvpDetailResponse,
    AdminRsvpListItemResponse,
    AdminRsvpMemberStatusResponse,
    CeremonyGuestNameResponse,
    ResetRsvpResponse,
)
from app.utils.rsvp_deadline import ensure_confirmation_window_open

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("", response_model=list[AdminRsvpListItemResponse])
def list_rsvps(db: Session = Depends(get_db)):
    rows = db.execute(
        select(RsvpResponse, InvitationGroup.nome_grupo)
        .join(InvitationGroup, InvitationGroup.id == RsvpResponse.group_id)
        .order_by(RsvpResponse.created_at.desc())
    ).all()

    return [
        AdminRsvpListItemResponse(
            id=response.id,
            group_id=response.group_id,
            nome_grupo=nome_grupo,
            mensagem=response.mensagem,
            total_confirmados=response.total_confirmados,
            created_at=response.created_at,
            updated_at=response.updated_at,
        )
        for response, nome_grupo in rows
    ]


@router.get("/{rsvp_id}", response_model=AdminRsvpDetailResponse)
def detail_rsvp(rsvp_id: uuid.UUID, db: Session = Depends(get_db)):
    row = db.execute(
        select(RsvpResponse, InvitationGroup.nome_grupo)
        .join(InvitationGroup, InvitationGroup.id == RsvpResponse.group_id)
        .where(RsvpResponse.id == rsvp_id)
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP nao encontrado.",
        )

    rsvp, nome_grupo = row

    members = db.execute(
        select(
            RsvpMemberStatus.member_id,
            GroupMember.nome.label("member_name"),
            RsvpMemberStatus.status,
        )
        .join(GroupMember, GroupMember.id == RsvpMemberStatus.member_id)
        .where(RsvpMemberStatus.response_id == rsvp_id)
        .order_by(GroupMember.ordem_exibicao.asc(), GroupMember.nome.asc())
    ).all()

    convidados_cerimonia = db.execute(
        select(CeremonyGuestName.id, CeremonyGuestName.nome)
        .where(CeremonyGuestName.response_id == rsvp_id)
        .order_by(CeremonyGuestName.created_at.asc())
    ).all()

    return AdminRsvpDetailResponse(
        id=rsvp.id,
        group_id=rsvp.group_id,
        nome_grupo=nome_grupo,
        mensagem=rsvp.mensagem,
        total_confirmados=rsvp.total_confirmados,
        created_at=rsvp.created_at,
        updated_at=rsvp.updated_at,
        members=[
            AdminRsvpMemberStatusResponse(
                member_id=member_id,
                member_name=member_name,
                status=status_value,
            )
            for member_id, member_name, status_value in members
        ],
        ceremony_guest_names=[
            CeremonyGuestNameResponse(id=guest_id, nome=nome)
            for guest_id, nome in convidados_cerimonia
        ],
    )


@router.delete("/{rsvp_id}", response_model=ResetRsvpResponse)
def reset_rsvp(
    rsvp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    response = db.get(RsvpResponse, rsvp_id)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP nao encontrado.",
        )

    group = db.get(InvitationGroup, response.group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo do RSVP nao encontrado.",
        )

    ensure_confirmation_window_open(db)

    db.delete(response)

    group.rsvp_status = RsvpStatus.PENDENTE
    group.responded_at = None
    group.updated_by = current_admin.id

    db.commit()
    return ResetRsvpResponse(reset=True, id=rsvp_id, group_id=group.id)
