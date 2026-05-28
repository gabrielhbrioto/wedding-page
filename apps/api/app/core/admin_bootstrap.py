import argparse
import getpass
import uuid
from urllib.parse import urlparse

from sqlalchemy import func, select
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.admin_user import AdminUser
from app.utils.security import hash_password

SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Cria ou atualiza um usuario admin para acesso ao painel.",
    )
    parser.add_argument("--email", required=True, help="Email do admin")
    parser.add_argument(
        "--password",
        default=None,
        help="Senha em texto plano (opcional: se omitida, sera solicitada em prompt seguro)",
    )
    parser.add_argument("--name", default=None, help="Nome opcional do admin")
    parser.add_argument(
        "--actor-email",
        default=None,
        help="Email de quem esta criando/atualizando (auditoria).",
    )
    return parser.parse_args()


def _resolve_password(cli_password: str | None) -> str:
    if cli_password:
        return cli_password

    first = getpass.getpass("Senha do admin: ")
    second = getpass.getpass("Confirme a senha: ")

    if first != second:
        raise ValueError("As senhas digitadas nao conferem.")

    if not first:
        raise ValueError("A senha nao pode ser vazia.")

    return first


def _normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if not normalized:
        raise ValueError("Email nao pode ser vazio.")
    return normalized


def _resolve_actor_id(db, actor_email: str | None) -> uuid.UUID:
    if not actor_email:
        return SYSTEM_USER_ID

    normalized_actor_email = _normalize_email(actor_email)

    actor = db.scalar(
        select(AdminUser).where(
            func.lower(AdminUser.email) == normalized_actor_email,
            AdminUser.active.is_(True),
        )
    )
    if actor:
        return actor.id

    print(
        "Aviso: actor-email nao encontrado/ativo. Usando usuario de sistema para auditoria.",
    )

    return SYSTEM_USER_ID


def _connection_error_message() -> str:
    parsed = urlparse(settings.DATABASE_URL)
    host = parsed.hostname or "(host nao identificado)"

    hints: list[str] = []
    if parsed.fragment:
        hints.append(
            "A URL contem fragmento (#...). Se a senha possui '#', codifique como %23.",
        )
    if host == "postgres" and ".supabase.co" in settings.DATABASE_URL:
        hints.append(
            "O host foi parseado como 'postgres', indicando URL malformada (senha com caractere especial sem encoding).",
        )
    if ".supabase.co" in settings.DATABASE_URL and "sslmode=" not in settings.DATABASE_URL:
        hints.append("Adicione '?sslmode=require' ao final da URL do Supabase.")

    base = (
        "Falha ao conectar no banco de dados. "
        f"Host configurado: {host}. "
        "Verifique DATABASE_URL no arquivo apps/api/.env, conectividade de rede e resolucao DNS do host."
    )

    if not hints:
        return base

    return base + " Dicas: " + " ".join(hints)


def upsert_admin_user(
    *,
    email: str,
    password: str,
    name: str | None,
    actor_id: uuid.UUID,
) -> tuple[AdminUser, bool]:
    normalized_email = _normalize_email(email)

    db = SessionLocal()
    try:
        existing = db.scalar(
            select(AdminUser).where(
                func.lower(AdminUser.email) == normalized_email,
            )
        )
        if existing:
            if name is not None:
                existing.name = name
            existing.email = normalized_email
            existing.password_hash = hash_password(password)
            existing.active = True
            existing.updated_by = actor_id
            db.commit()
            db.refresh(existing)
            return existing, False

        created = AdminUser(
            email=normalized_email,
            name=name,
            password_hash=hash_password(password),
            active=True,
            created_by=actor_id,
            updated_by=actor_id,
        )
        db.add(created)
        db.commit()
        db.refresh(created)
        return created, True
    finally:
        db.close()


def main() -> None:
    args = _parse_args()
    try:
        email = _normalize_email(args.email)
        password = _resolve_password(args.password)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    try:
        db = SessionLocal()
        try:
            actor_id = _resolve_actor_id(db, args.actor_email)
        finally:
            db.close()

        admin, is_created = upsert_admin_user(
            email=email,
            password=password,
            name=args.name,
            actor_id=actor_id,
        )
    except OperationalError as exc:
        raise SystemExit(_connection_error_message()) from exc

    action = "criado" if is_created else "atualizado"
    print(
        f"Usuario admin {action}: id={admin.id} email={admin.email} active={admin.active}",
    )


if __name__ == "__main__":
    main()
