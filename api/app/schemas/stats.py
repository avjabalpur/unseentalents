from app.schemas.base import CamelModel


class CountItem(CamelModel):
    label: str
    count: int


class AdminStats(CamelModel):
    submissions_by_event: list[CountItem]
    submissions_by_event_type: list[CountItem]
    submissions_by_status: list[CountItem]
    votes_by_event: list[CountItem]
    users_by_role: list[CountItem]
    events_by_status: list[CountItem]
