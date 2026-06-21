from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.database import get_db
from app.schemas.dashboard import DashboardResponse

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    dashboard_row = db.execute(
        text(
            """
            select
                count(*)::int as total_groups,
                count(*) filter (where rsvp_status = 'RESPONDIDO')::int as confirmed,
                count(*) filter (where rsvp_status = 'PENDENTE')::int as pending,
                count(*) filter (where tipo_convite = 'CERIMONIA')::int as ceremony_groups
            from invitation_groups
            """
        )
    ).mappings().first() or {}

    dinner_row = db.execute(
        text(
            """
            select
                count(*) filter (where status = 'CERIMONIA_E_JANTAR')::int as dinner_count
            from rsvp_member_status
            """
        )
    ).mappings().first() or {}

    total_groups = int(dashboard_row.get("total_groups", 0))
    confirmed = int(dashboard_row.get("confirmed", 0))

    return DashboardResponse(
        total_groups=total_groups,
        confirmed=confirmed,
        pending=int(dashboard_row.get("pending", 0)),
        dinner_count=int(dinner_row.get("dinner_count", 0)),
        ceremony_groups=int(dashboard_row.get("ceremony_groups", 0)),
        response_rate_percent=round((confirmed / total_groups) * 100, 1) if total_groups else 0.0,
    )
