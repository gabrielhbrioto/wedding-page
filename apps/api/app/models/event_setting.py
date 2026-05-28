from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class EventSetting(Base):
    __tablename__ = "event_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    nome_casal: Mapped[str] = mapped_column(String(200), nullable=False)
    data_evento: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    rsvp_deadline_offset_days: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    local_nome: Mapped[str | None] = mapped_column(String(200), nullable=True)
    endereco: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    gift_list_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    mensagem_home: Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        server_default=text("true"),
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=False,
        default=SYSTEM_USER_ID,
    )
    updated_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=False,
        default=SYSTEM_USER_ID,
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("now()"),
    )
