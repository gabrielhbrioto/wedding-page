from fastapi import APIRouter
from . import (
    auth,
    dashboard,
    export,
    gallery,
    gifts,
    groups,
    members,
    public,
    rsvps,
    settings,
    stats,
)

api_router = APIRouter()

api_router.include_router(public.router, prefix="/public", tags=["Public"])
api_router.include_router(auth.router, prefix="/admin/auth", tags=["Auth"])
api_router.include_router(groups.router, prefix="/admin/groups", tags=["Groups"])
api_router.include_router(
	members.router,
	prefix="/admin/members",
	tags=["Members"],
)
api_router.include_router(
	rsvps.router,
	prefix="/admin/rsvps",
	tags=["RSVP"],
)
api_router.include_router(
	dashboard.router,
	prefix="/admin/dashboard",
	tags=["Dashboard"],
)
api_router.include_router(
	stats.router,
	prefix="/admin/stats",
	tags=["Stats"],
)
api_router.include_router(gifts.router, prefix="/admin/gifts", tags=["Gifts"])
api_router.include_router(
	gallery.router,
	prefix="/admin/gallery",
	tags=["Gallery"],
)
api_router.include_router(export.router, prefix="/admin/export", tags=["Export"])
api_router.include_router(
	settings.router,
	prefix="/admin/settings",
	tags=["Settings"],
)
