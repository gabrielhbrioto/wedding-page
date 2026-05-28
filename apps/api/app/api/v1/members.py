import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.groups import DeleteEntityResponse, GroupMemberResponse
from app.schemas.members import UpdateMemberRequest

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
    result = db.execute(
        text("delete from group_members where id = :member_id"),
        {"member_id": member_id},
    )

    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado.",
        )

    db.commit()
    return {
        "deleted": True,
        "id": str(member_id),
    }
