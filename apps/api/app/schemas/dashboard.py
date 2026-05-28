from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_groups: int
    confirmed: int
    pending: int
    dinner_count: int
    ceremony_groups: int
    response_rate_percent: float
