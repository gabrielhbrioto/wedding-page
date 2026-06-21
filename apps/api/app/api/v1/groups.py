import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.enums import InviteType, MemberStatus
from app.models.group_member import GroupMember
from app.models.invitation_group import InvitationGroup
from app.models.rsvp_member_status import RsvpMemberStatus
from app.models.rsvp_response import RsvpResponse
from app.schemas.groups import (
    CreateGroupMemberRequest,
    CreateGroupMemberResponse,
    CreateGroupRequest,
    DeleteEntityResponse,
    GroupDetailResponse,
    GroupMemberResponse,
    GroupResponse,
    UpdateGroupRequest,
)
from app.utils.rsvp_deadline import ensure_confirmation_window_open

router = APIRouter(dependencies=[Depends(require_admin)])


def _to_group_response(group: InvitationGroup) -> GroupResponse:
    return GroupResponse(
        id=group.id,
        token=group.token,
        nome_grupo=group.nome_grupo,
        tipo_convite=group.tipo_convite,
        observacoes=group.observacoes,
        rsvp_status=group.rsvp_status,
        responded_at=group.responded_at,
        created_at=group.created_at,
        updated_at=group.updated_at,
    )


def _to_member_response(
    member: GroupMember,
    status: MemberStatus | None = None,
) -> GroupMemberResponse:
    return GroupMemberResponse(
        id=member.id,
        group_id=member.group_id,
        nome=member.nome,
        status=status,
        pre_cadastrado=member.pre_cadastrado,
        ordem_exibicao=member.ordem_exibicao,
        created_at=member.created_at,
    )


@router.get("", response_model=list[GroupResponse])
def list_groups(db: Session = Depends(get_db)):
    groups = db.scalars(
        select(InvitationGroup).order_by(InvitationGroup.created_at.desc())
    ).all()
    return [_to_group_response(group) for group in groups]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GroupResponse)
def create_group(
    payload: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    ensure_confirmation_window_open(db)

    try:
        group = InvitationGroup(
            token=payload.token,
            nome_grupo=payload.nome_grupo,
            tipo_convite=InviteType.CERIMONIA_JANTAR,
            observacoes=payload.observacoes,
            created_by=current_admin.id,
            updated_by=current_admin.id,
        )
        db.add(group)
        db.commit()
        db.refresh(group)
        return _to_group_response(group)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nao foi possivel criar o grupo (token duplicado ou dados invalidos).",
        ) from exc


@router.get("/{group_id}", response_model=GroupDetailResponse)
def detail_group(group_id: uuid.UUID, db: Session = Depends(get_db)):
    group = db.get(InvitationGroup, group_id)

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo nao encontrado.",
        )

    response_id = db.scalar(select(RsvpResponse.id).where(RsvpResponse.group_id == group_id))

    status_by_member_id: dict[uuid.UUID, MemberStatus] = {}
    if response_id:
        status_rows = db.execute(
            select(RsvpMemberStatus.member_id, RsvpMemberStatus.status).where(
                RsvpMemberStatus.response_id == response_id
            )
        ).all()
        status_by_member_id = {
            member_id: status_value for member_id, status_value in status_rows
        }

    members = db.scalars(
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.ordem_exibicao.asc(), GroupMember.nome.asc())
    ).all()

    return GroupDetailResponse(
        **_to_group_response(group).model_dump(),
        members=[
            _to_member_response(member, status_by_member_id.get(member.id))
            for member in members
        ],
    )


@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: uuid.UUID,
    payload: UpdateGroupRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    try:
        group = db.get(InvitationGroup, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grupo nao encontrado.",
            )

        if payload.rsvp_status is not None or payload.responded_at is not None:
            ensure_confirmation_window_open(db)

        if payload.token is not None:
            group.token = payload.token
        if payload.nome_grupo is not None:
            group.nome_grupo = payload.nome_grupo
        if payload.tipo_convite is not None:
            group.tipo_convite = payload.tipo_convite
        if payload.observacoes is not None:
            group.observacoes = payload.observacoes
        if payload.rsvp_status is not None:
            group.rsvp_status = payload.rsvp_status
        if payload.responded_at is not None:
            group.responded_at = payload.responded_at

        group.updated_by = current_admin.id

        db.commit()
        db.refresh(group)
        return _to_group_response(group)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nao foi possivel atualizar o grupo (token duplicado ou dados invalidos).",
        ) from exc


@router.delete("/{group_id}", response_model=DeleteEntityResponse)
def delete_group(group_id: uuid.UUID, db: Session = Depends(get_db)):
    group = db.get(InvitationGroup, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo nao encontrado.",
        )

    db.delete(group)
    db.commit()
    return DeleteEntityResponse(deleted=True, id=group_id)


@router.post(
    "/{group_id}/members",
    status_code=status.HTTP_201_CREATED,
    response_model=CreateGroupMemberResponse,
)
def create_group_member(
    group_id: uuid.UUID,
    payload: CreateGroupMemberRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    group = db.get(InvitationGroup, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo nao encontrado.",
        )

    ensure_confirmation_window_open(db)

    member = GroupMember(
        group_id=group_id,
        nome=payload.nome,
        pre_cadastrado=payload.pre_cadastrado,
        ordem_exibicao=payload.ordem_exibicao,
        created_by=current_admin.id,
        updated_by=current_admin.id,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return CreateGroupMemberResponse(
        created=True,
        group_id=group_id,
        member=_to_member_response(member),
    )
