from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.schemas.stats import GiftsStatsResponse, PresenceStatsResponse

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/presence", response_model=PresenceStatsResponse)
def presence_stats(db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            select
                count(*)::int as total_members,
                count(rms.id)::int as responded_members,
                count(*) filter (where rms.id is null)::int as pending_members,
                count(*) filter (where rms.status = 'CERIMONIA_E_JANTAR')::int as dinner_confirmed,
                count(*) filter (where rms.status = 'SOMENTE_CERIMONIA')::int as ceremony_only,
                count(*) filter (where rms.status = 'AUSENTE')::int as absent
            from group_members gm
            left join rsvp_member_status rms on rms.member_id = gm.id
            """
        )
    ).mappings().first() or {}

    return PresenceStatsResponse(
        dinner_confirmed=int(row.get("dinner_confirmed", 0)),
        ceremony_only=int(row.get("ceremony_only", 0)),
        absent=int(row.get("absent", 0)),
        total_members=int(row.get("total_members", 0)),
        responded_members=int(row.get("responded_members", 0)),
        pending_members=int(row.get("pending_members", 0)),
    )


@router.get("/gifts", response_model=GiftsStatsResponse)
def gifts_stats(db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            select
                count(*)::int as total_items,
                count(*) filter (where coalesce(ativo, true) = true)::int as active_items,
                count(*) filter (where coalesce(ativo, true) = false)::int as reserved_items
            from gifts
            """
        )
    ).mappings().first()

    return GiftsStatsResponse(
        total_items=int((row or {}).get("total_items", 0)),
        active_items=int((row or {}).get("active_items", 0)),
        reserved_items=int((row or {}).get("reserved_items", 0)),
    )
