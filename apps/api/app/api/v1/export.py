from fastapi import APIRouter, Depends

from .dependencies import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/rsvps.csv")
def export_rsvps_csv():
    return {"url": "generated-rsvps.csv"}


@router.get("/groups.csv")
def export_groups_csv():
    return {"url": "generated-groups.csv"}


@router.get("/gifts.csv")
def export_gifts_csv():
    return {"url": "generated-gifts.csv"}
