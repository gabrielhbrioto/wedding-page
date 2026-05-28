from pydantic import BaseModel, Field


class UpdateMemberRequest(BaseModel):
    nome: str | None = Field(default=None, max_length=150)
    pre_cadastrado: bool | None = None
    ordem_exibicao: int | None = None
