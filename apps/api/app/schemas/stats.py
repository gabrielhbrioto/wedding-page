from pydantic import BaseModel


class PresenceStatsResponse(BaseModel):
    dinner_confirmed: int
    ceremony_only: int
    absent: int
    total_members: int
    responded_members: int
    pending_members: int


class GiftsStatsResponse(BaseModel):
    total_items: int
    active_items: int
    reserved_items: int
