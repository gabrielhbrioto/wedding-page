import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.groups import DeleteEntityResponse, GroupMemberResponse
from app.schemas.members import UpdateMemberRequest
from app.utils.rsvp_deadline import ensure_confirmation_window_open

router = APIRouter(dependencies=[Depends(require_admin)])


@router.put("/{member_id}", response_model=GroupMemberResponse)
def update_member(
    member_id: uuid.UUID,
    payload: UpdateMemberRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_admin),
):
    row = db.execute(
        text(
            """
            update group_members
            set
                nome = coalesce(:nome, nome),
                pre_cadastrado = coalesce(:pre_cadastrado, pre_cadastrado),
                ordem_exibicao = coalesce(:ordem_exibicao, ordem_exibicao),
                updated_by = :updated_by
            where id = :member_id
            returning
                id,
                group_id,
                nome,
                pre_cadastrado,
                ordem_exibicao,
                created_at
            """
        ),
        {
            "member_id": member_id,
            "nome": payload.nome,
            "pre_cadastrado": payload.pre_cadastrado,
            "ordem_exibicao": payload.ordem_exibicao,
            "updated_by": current_admin.id,
        },
    ).mappings().first()

    if not row:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado.",
        )

    db.commit()
    return row


@router.delete("/{member_id}", response_model=DeleteEntityResponse)
def delete_member(member_id: uuid.UUID, db: Session = Depends(get_db)):
    ensure_confirmation_window_open(db)

    row = db.execute(
        text("delete from group_members where id = :member_id returning group_id"),
        {"member_id": member_id},
    ).first()

    if not row:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado.",
        )

    # O status individual do membro e removido via ON DELETE CASCADE;
    # o total agregado da resposta precisa ser recalculado manualmente.
    db.execute(
        text(
            """
            update rsvp_responses r
            set total_confirmados = (
                select count(*)
                from rsvp_member_status s
                where s.response_id = r.id
                  and s.status <> 'AUSENTE'
            )
            where r.group_id = :group_id
            """
        ),
        {"group_id": row.group_id},
    )

    db.commit()
    return {
        "deleted": True,
        "id": str(member_id),
    }
