from __future__ import annotations

import re
import sys
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

# Force model registration in Base.metadata
import app.models  # noqa: F401
from app.core.database import Base


ROOT_DIR = Path(__file__).resolve().parents[3]
MIGRATIONS_DIR = ROOT_DIR / "supabase" / "migrations"
SCHEMAS_DIR = ROOT_DIR / "apps" / "api" / "app" / "schemas"
API_V1_DIR = ROOT_DIR / "apps" / "api" / "app" / "api" / "v1"

EXPECTED_TABLES = {
    "admin_users",
    "invitation_groups",
    "group_members",
    "rsvp_responses",
    "rsvp_member_status",
    "ceremony_guest_names",
    "event_settings",
    "gifts",
    "gallery_photos",
}

EXPECTED_SCHEMA_MODULES = {
    "auth.py",
    "dashboard.py",
    "gallery.py",
    "gifts.py",
    "groups.py",
    "members.py",
    "rsvp.py",
    "settings.py",
    "stats.py",
}

EXPECTED_ENDPOINTS_WITH_RESPONSE_MODEL = {
    "dashboard.py",
    "gifts.py",
    "groups.py",
    "members.py",
    "rsvps.py",
    "settings.py",
    "stats.py",
}


def _extract_tables_from_migrations() -> set[str]:
    table_names: set[str] = set()
    pattern = re.compile(r"create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z_][\w]*)", re.IGNORECASE)

    for file_path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        content = file_path.read_text(encoding="utf-8")
        for match in pattern.findall(content):
            table_names.add(match.lower())

    return table_names


def _validate_endpoint_response_models() -> list[str]:
    errors: list[str] = []
    for endpoint_file in sorted(EXPECTED_ENDPOINTS_WITH_RESPONSE_MODEL):
        file_path = API_V1_DIR / endpoint_file
        if not file_path.exists():
            errors.append(f"endpoint ausente: {endpoint_file}")
            continue

        content = file_path.read_text(encoding="utf-8")
        if "response_model=" not in content:
            errors.append(f"endpoint sem response_model explicito: {endpoint_file}")

    return errors


def main() -> int:
    errors: list[str] = []

    migration_tables = _extract_tables_from_migrations()
    metadata_tables = {table_name.lower() for table_name in Base.metadata.tables.keys()}

    missing_in_migrations = EXPECTED_TABLES - migration_tables
    if missing_in_migrations:
        errors.append(
            "tabelas esperadas ausentes nas migrations: " + ", ".join(sorted(missing_in_migrations))
        )

    missing_models = EXPECTED_TABLES - metadata_tables
    if missing_models:
        errors.append(
            "tabelas esperadas ausentes nos models (Base.metadata): " + ", ".join(sorted(missing_models))
        )

    schema_modules = {p.name for p in SCHEMAS_DIR.glob("*.py") if p.name != "__init__.py"}
    missing_schema_modules = EXPECTED_SCHEMA_MODULES - schema_modules
    if missing_schema_modules:
        errors.append(
            "schemas esperados ausentes em app/schemas: " + ", ".join(sorted(missing_schema_modules))
        )

    errors.extend(_validate_endpoint_response_models())

    if errors:
        print("[Wave7] FALHA no check migration-model-schema:")
        for item in errors:
            print(f"- {item}")
        return 1

    print("[Wave7] Check migration-model-schema OK")
    print(f"- tabelas em migrations: {len(migration_tables)}")
    print(f"- tabelas mapeadas no ORM: {len(metadata_tables)}")
    print(f"- schemas centralizados: {len(schema_modules)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
