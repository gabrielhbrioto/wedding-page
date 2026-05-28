from datetime import datetime
import uuid

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import InviteType, RsvpStatus

SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class InvitationGroup(Base):
    __tablename__ = "invitation_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    token: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
    nome_grupo: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo_convite: Mapped[InviteType] = mapped_column(
        SAEnum(InviteType, name="invite_type", create_type=False),
        nullable=False,
        server_default=text("'CERIMONIA'::invite_type"),
    )
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rsvp_status: Mapped[RsvpStatus] = mapped_column(
        SAEnum(RsvpStatus, name="rsvp_status", create_type=False),
        nullable=False,
        server_default=text("'PENDENTE'::rsvp_status"),
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("now()"),
    )
