from enum import Enum


class InviteType(str, Enum):
    CERIMONIA = "CERIMONIA"
    CERIMONIA_JANTAR = "CERIMONIA_JANTAR"
    VIP = "VIP"


class MemberStatus(str, Enum):
    CERIMONIA_E_JANTAR = "CERIMONIA_E_JANTAR"
    SOMENTE_CERIMONIA = "SOMENTE_CERIMONIA"
    AUSENTE = "AUSENTE"


class RsvpStatus(str, Enum):
    PENDENTE = "PENDENTE"
    RESPONDIDO = "RESPONDIDO"
