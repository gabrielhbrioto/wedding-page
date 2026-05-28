from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import subprocess
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.models.enums import InviteType, MemberStatus, RsvpStatus
from app.models.admin_user import AdminUser
from app.models.gift import Gift
from app.models.group_member import GroupMember
from app.models.invitation_group import InvitationGroup
from app.models.rsvp_member_status import RsvpMemberStatus
from app.models.rsvp_response import RsvpResponse
from main import app


pytestmark = pytest.mark.integration


def _integration_enabled() -> bool:
    value = os.getenv("WAVE7_RUN_INTEGRATION", "0").strip().lower()
    return value in {"1", "true", "yes", "on"}


@pytest.fixture(scope="session")
def ensure_integration_enabled() -> None:
    if not _integration_enabled():
        pytest.skip(
            "Defina WAVE7_RUN_INTEGRATION=1 para executar os testes de integracao da Onda 7.",
            allow_module_level=True,
        )


@pytest.fixture()
def admin_fixture(ensure_integration_enabled: None):
    unique = uuid.uuid4().hex[:10]
    email = f"wave7.{unique}@example.com"
    password = "Wave7#Pass123"
    name = f"Wave7 Admin {unique}"

    script_path = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "create_admin.sh")
    script_path = os.path.abspath(script_path)

    result = subprocess.run(
        [
            script_path,
            "--email",
            email.upper(),
            "--password",
            password,
            "--name",
            name,
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
    )

    if result.returncode != 0:
        raise AssertionError(
            "Falha ao executar create_admin.sh\n"
            f"stdout:\n{result.stdout}\n"
            f"stderr:\n{result.stderr}",
        )

    db = SessionLocal()
    try:
        admin = db.scalar(select(AdminUser).where(AdminUser.email == email))
        if not admin:
            raise AssertionError("Admin criado pelo script nao encontrado no banco.")
        admin_id = admin.id
    finally:
        db.close()

    payload = {
        "email": email,
        "password": password,
        "name": name,
        "admin_id": admin_id,
    }

    try:
        yield payload
    finally:
        db = SessionLocal()
        try:
            db.execute(
                delete(InvitationGroup).where(
                    InvitationGroup.token.like(f"wave7-{unique}%")
                )
            )
            db.execute(
                delete(Gift).where(Gift.nome.like(f"Wave7 Gift {unique}%"))
            )
            db.execute(delete(AdminUser).where(AdminUser.id == admin_id))
            db.commit()
        finally:
            db.close()


@pytest.fixture()
def admin_client(admin_fixture):
    client = TestClient(app)
    login_response = client.post(
        "/api/v1/admin/auth/login",
        json={
            "email": admin_fixture["email"].upper(),
            "password": admin_fixture["password"],
            "remember_me": False,
        },
    )

    assert login_response.status_code == 200, login_response.text
    assert login_response.json()["success"] is True
    assert "access_token" in login_response.cookies
    return client


def _normalize_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed

    return parsed.astimezone(timezone.utc).replace(tzinfo=None)


def _snapshot_event_settings(payload: dict[str, object]) -> dict[str, object]:
    keys = [
        "nome_casal",
        "data_evento",
        "rsvp_deadline_offset_days",
        "local_nome",
        "endereco",
        "google_maps_url",
        "gift_list_url",
        "mensagem_home",
        "ativo",
    ]
    return {key: payload.get(key) for key in keys if key in payload}


def test_create_admin_login_and_group_crud_with_audit(admin_fixture, admin_client):
    unique = admin_fixture["email"].split("@")[0].split(".")[-1]
    token = f"wave7-{unique}-group"

    create_response = admin_client.post(
        "/api/v1/admin/groups/",
        json={
            "token": token,
            "nome_grupo": "Grupo Wave7",
            "tipo_convite": "CERIMONIA",
            "observacoes": "teste onda 7",
        },
    )
    assert create_response.status_code == 201, create_response.text
    assert create_response.json()["tipo_convite"] == InviteType.CERIMONIA_JANTAR.value
    group_id = create_response.json()["id"]

    db = SessionLocal()
    try:
        created_group = db.get(InvitationGroup, uuid.UUID(group_id))
        assert created_group is not None
        assert created_group.tipo_convite == InviteType.CERIMONIA_JANTAR
        assert created_group.created_by == admin_fixture["admin_id"]
        assert created_group.updated_by == admin_fixture["admin_id"]
    finally:
        db.close()

    update_response = admin_client.put(
        f"/api/v1/admin/groups/{group_id}",
        json={"nome_grupo": "Grupo Wave7 Atualizado"},
    )
    assert update_response.status_code == 200, update_response.text

    db = SessionLocal()
    try:
        updated_group = db.get(InvitationGroup, uuid.UUID(group_id))
        assert updated_group is not None
        assert updated_group.tipo_convite == InviteType.CERIMONIA_JANTAR
        assert updated_group.created_by == admin_fixture["admin_id"]
        assert updated_group.updated_by == admin_fixture["admin_id"]
        assert updated_group.nome_grupo == "Grupo Wave7 Atualizado"
    finally:
        db.close()

    delete_response = admin_client.delete(f"/api/v1/admin/groups/{group_id}")
    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["deleted"] is True


def test_gift_crud_with_audit(admin_fixture, admin_client):
    unique = admin_fixture["email"].split("@")[0].split(".")[-1]
    gift_name = f"Wave7 Gift {unique}"

    create_response = admin_client.post(
        "/api/v1/admin/gifts/",
        json={
            "nome": gift_name,
            "descricao": "gift integration test",
            "preco": 123.45,
            "ativo": True,
            "ordem": 10,
        },
    )
    assert create_response.status_code == 201, create_response.text
    gift_id = create_response.json()["id"]

    db = SessionLocal()
    try:
        created_gift = db.get(Gift, uuid.UUID(gift_id))
        assert created_gift is not None
        assert created_gift.created_by == admin_fixture["admin_id"]
        assert created_gift.updated_by == admin_fixture["admin_id"]
    finally:
        db.close()

    update_response = admin_client.put(
        f"/api/v1/admin/gifts/{gift_id}",
        json={"descricao": "gift integration test updated", "ativo": False},
    )
    assert update_response.status_code == 200, update_response.text

    db = SessionLocal()
    try:
        updated_gift = db.get(Gift, uuid.UUID(gift_id))
        assert updated_gift is not None
        assert updated_gift.created_by == admin_fixture["admin_id"]
        assert updated_gift.updated_by == admin_fixture["admin_id"]
        assert updated_gift.descricao == "gift integration test updated"
        assert updated_gift.ativo is False
    finally:
        db.close()

    delete_response = admin_client.delete(f"/api/v1/admin/gifts/{gift_id}")
    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["deleted"] is True


def test_event_settings_crud_and_deadline_projection(admin_fixture, admin_client):
    original_response = admin_client.get("/api/v1/admin/settings/")
    original_settings = original_response.json() if original_response.status_code == 200 else None

    if original_response.status_code == 200:
        delete_original = admin_client.delete("/api/v1/admin/settings/")
        assert delete_original.status_code == 200, delete_original.text

    create_payload = {
        "nome_casal": "Gabriel & Débora Teste",
        "data_evento": (datetime.now(timezone.utc).replace(microsecond=0, tzinfo=None) + timedelta(days=365)).isoformat(),
        "rsvp_deadline_offset_days": 30,
        "local_nome": "Casa do evento",
        "endereco": "Rua Exemplo, 123",
        "google_maps_url": "https://maps.example.com",
        "gift_list_url": "https://lista.example.com/casal",
        "mensagem_home": "Bem-vindos ao casamento.",
        "ativo": True,
    }

    create_response = admin_client.post("/api/v1/admin/settings/", json=create_payload)
    assert create_response.status_code == 200, create_response.text
    created_settings = create_response.json()["settings"]
    expected_deadline = _normalize_datetime(create_payload["data_evento"]) - timedelta(days=30)
    assert _normalize_datetime(created_settings["confirmation_deadline_at"]) == expected_deadline
    assert created_settings["rsvp_deadline_offset_days"] == 30
    assert created_settings["gift_list_url"] == create_payload["gift_list_url"]

    update_response = admin_client.put(
        "/api/v1/admin/settings/",
        json={
            "mensagem_home": "Mensagem atualizada",
            "rsvp_deadline_offset_days": 45,
            "gift_list_url": "https://lista.example.com/casal-atualizada",
        },
    )
    assert update_response.status_code == 200, update_response.text
    updated_settings = update_response.json()["settings"]
    assert updated_settings["mensagem_home"] == "Mensagem atualizada"
    assert updated_settings["rsvp_deadline_offset_days"] == 45
    assert _normalize_datetime(updated_settings["confirmation_deadline_at"]) == _normalize_datetime(create_payload["data_evento"]) - timedelta(days=45)
    assert updated_settings["gift_list_url"] == "https://lista.example.com/casal-atualizada"

    clear_link_response = admin_client.put(
        "/api/v1/admin/settings/",
        json={"gift_list_url": None},
    )
    assert clear_link_response.status_code == 200, clear_link_response.text
    assert clear_link_response.json()["settings"]["gift_list_url"] is None

    public_event = admin_client.get("/api/v1/public/event")
    assert public_event.status_code == 200, public_event.text
    assert public_event.json()["confirmation_deadline_at"] == updated_settings["confirmation_deadline_at"]
    assert public_event.json()["gift_list_url"] is None

    delete_response = admin_client.delete("/api/v1/admin/settings/")
    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["deleted"] is True

    missing_response = admin_client.get("/api/v1/admin/settings/")
    assert missing_response.status_code == 404, missing_response.text

    restore_payload = (
        _snapshot_event_settings(original_settings)
        if original_settings
        else create_payload
    )
    restore_response = admin_client.post("/api/v1/admin/settings/", json=restore_payload)
    assert restore_response.status_code == 200, restore_response.text


def test_dashboard_and_presence_metrics_return_extended_counts(admin_fixture, admin_client):
    unique = admin_fixture["email"].split("@")[0].split(".")[-1]

    db = SessionLocal()
    try:
        ceremony_group = InvitationGroup(
            token=f"wave7-{unique}-ceremony",
            nome_grupo="Wave7 Ceremony",
            tipo_convite=InviteType.CERIMONIA,
            created_by=admin_fixture["admin_id"],
            updated_by=admin_fixture["admin_id"],
        )
        dinner_group = InvitationGroup(
            token=f"wave7-{unique}-dinner",
            nome_grupo="Wave7 Dinner",
            tipo_convite=InviteType.CERIMONIA_JANTAR,
            created_by=admin_fixture["admin_id"],
            updated_by=admin_fixture["admin_id"],
        )
        vip_group = InvitationGroup(
            token=f"wave7-{unique}-vip",
            nome_grupo="Wave7 VIP",
            tipo_convite=InviteType.VIP,
            created_by=admin_fixture["admin_id"],
            updated_by=admin_fixture["admin_id"],
        )
        db.add_all([ceremony_group, dinner_group, vip_group])
        db.flush()
        ceremony_group_id = ceremony_group.id
        dinner_group_id = dinner_group.id
        vip_group_id = vip_group.id
        db.commit()
    finally:
        db.close()

    ceremony_member = admin_client.post(
        f"/api/v1/admin/groups/{ceremony_group_id}/members",
        json={"nome": "Ceremony One"},
    )
    assert ceremony_member.status_code == 201, ceremony_member.text
    ceremony_member_id = ceremony_member.json()["member"]["id"]

    dinner_member_one = admin_client.post(
        f"/api/v1/admin/groups/{dinner_group_id}/members",
        json={"nome": "Dinner One"},
    )
    assert dinner_member_one.status_code == 201, dinner_member_one.text
    dinner_member_one_id = dinner_member_one.json()["member"]["id"]

    dinner_member_two = admin_client.post(
        f"/api/v1/admin/groups/{dinner_group_id}/members",
        json={"nome": "Dinner Two"},
    )
    assert dinner_member_two.status_code == 201, dinner_member_two.text
    dinner_member_two_id = dinner_member_two.json()["member"]["id"]

    vip_member = admin_client.post(
        f"/api/v1/admin/groups/{vip_group_id}/members",
        json={"nome": "VIP One"},
    )
    assert vip_member.status_code == 201, vip_member.text

    responded_at = datetime.now(timezone.utc).isoformat()
    ceremony_update = admin_client.put(
        f"/api/v1/admin/groups/{ceremony_group_id}",
        json={"rsvp_status": RsvpStatus.RESPONDIDO.value, "responded_at": responded_at},
    )
    assert ceremony_update.status_code == 200, ceremony_update.text

    dinner_update = admin_client.put(
        f"/api/v1/admin/groups/{dinner_group_id}",
        json={"rsvp_status": RsvpStatus.RESPONDIDO.value, "responded_at": responded_at},
    )
    assert dinner_update.status_code == 200, dinner_update.text

    db = SessionLocal()
    try:
        ceremony_response = RsvpResponse(
            group_id=ceremony_group_id,
            mensagem="Wave7 ceremony RSVP",
            total_confirmados=1,
            created_by=admin_fixture["admin_id"],
            updated_by=admin_fixture["admin_id"],
        )
        dinner_response = RsvpResponse(
            group_id=dinner_group_id,
            mensagem="Wave7 dinner RSVP",
            total_confirmados=1,
            created_by=admin_fixture["admin_id"],
            updated_by=admin_fixture["admin_id"],
        )
        db.add_all([ceremony_response, dinner_response])
        db.flush()

        db.add_all(
            [
                RsvpMemberStatus(
                    response_id=ceremony_response.id,
                    member_id=uuid.UUID(ceremony_member_id),
                    status=MemberStatus.SOMENTE_CERIMONIA,
                    created_by=admin_fixture["admin_id"],
                    updated_by=admin_fixture["admin_id"],
                ),
                RsvpMemberStatus(
                    response_id=dinner_response.id,
                    member_id=uuid.UUID(dinner_member_one_id),
                    status=MemberStatus.CERIMONIA_E_JANTAR,
                    created_by=admin_fixture["admin_id"],
                    updated_by=admin_fixture["admin_id"],
                ),
                RsvpMemberStatus(
                    response_id=dinner_response.id,
                    member_id=uuid.UUID(dinner_member_two_id),
                    status=MemberStatus.AUSENTE,
                    created_by=admin_fixture["admin_id"],
                    updated_by=admin_fixture["admin_id"],
                ),
            ]
        )
        db.commit()
    finally:
        db.close()

    dashboard_response = admin_client.get("/api/v1/admin/dashboard")
    assert dashboard_response.status_code == 200, dashboard_response.text
    dashboard = dashboard_response.json()
    assert dashboard["total_groups"] == 3
    assert dashboard["confirmed"] == 2
    assert dashboard["pending"] == 1
    assert dashboard["dinner_count"] == 1
    assert dashboard["ceremony_groups"] == 1
    assert dashboard["response_rate_percent"] == pytest.approx(66.7)

    presence_response = admin_client.get("/api/v1/admin/stats/presence")
    assert presence_response.status_code == 200, presence_response.text
    presence = presence_response.json()
    assert presence["dinner_confirmed"] == 1
    assert presence["ceremony_only"] == 1
    assert presence["absent"] == 1
    assert presence["total_members"] == 4
    assert presence["responded_members"] == 3
    assert presence["pending_members"] == 1

    ceremony_group_detail = admin_client.get(f"/api/v1/admin/groups/{ceremony_group['id']}")
    assert ceremony_group_detail.status_code == 200, ceremony_group_detail.text
    ceremony_members = ceremony_group_detail.json()["members"]
    assert ceremony_members[0]["status"] == MemberStatus.SOMENTE_CERIMONIA.value

    dinner_group_detail = admin_client.get(f"/api/v1/admin/groups/{dinner_group['id']}")
    assert dinner_group_detail.status_code == 200, dinner_group_detail.text
    dinner_members = {
        member["nome"]: member["status"] for member in dinner_group_detail.json()["members"]
    }
    assert dinner_members == {
        "Dinner One": MemberStatus.CERIMONIA_E_JANTAR.value,
        "Dinner Two": MemberStatus.AUSENTE.value,
    }


def test_public_open_rsvp_persists_token_and_can_be_edited(admin_fixture):
    unique = admin_fixture["email"].split("@")[0].split(".")[-1]
    guest_names = [
        f"Wave7 Open Guest One {unique}",
        f"Wave7 Open Guest Two {unique}",
    ]

    public_client = TestClient(app)
    open_response = public_client.post(
        "/api/v1/public/rsvp/open",
        json={
            "guest_names": guest_names,
            "message": "Estamos confirmados para a cerimônia",
        },
    )
    assert open_response.status_code == 200, open_response.text
    body = open_response.json()
    assert body["success"] is True
    assert body["total_confirmados"] == 2
    token = body["token"]

    db = SessionLocal()
    try:
        group = db.scalar(select(InvitationGroup).where(InvitationGroup.token == token))
        assert group is not None
        assert group.tipo_convite == InviteType.CERIMONIA
        assert group.rsvp_status == RsvpStatus.RESPONDIDO
        assert group.responded_at is not None

        members = db.scalars(
            select(GroupMember)
            .where(GroupMember.group_id == group.id)
            .order_by(GroupMember.ordem_exibicao.asc())
        ).all()
        assert [member.nome for member in members] == guest_names
        assert all(member.pre_cadastrado is False for member in members)

        response = db.scalar(select(RsvpResponse).where(RsvpResponse.group_id == group.id))
        assert response is not None
        assert response.mensagem == "Estamos confirmados para a cerimônia"
        assert response.total_confirmados == 2
        response_id_before_edit = response.id

        statuses = db.scalars(
            select(RsvpMemberStatus).where(RsvpMemberStatus.response_id == response.id)
        ).all()
        assert len(statuses) == 2
        assert {status.status for status in statuses} == {MemberStatus.SOMENTE_CERIMONIA}
    finally:
        db.close()

    edit_response = public_client.post(
        f"/api/v1/public/rsvp/{token}",
        json={
            "message": "Atualizamos a resposta",
            "members": [
                {
                    "member_id": str(member.id),
                    "status": MemberStatus.AUSENTE.value if index == 0 else MemberStatus.SOMENTE_CERIMONIA.value,
                }
                for index, member in enumerate(members)
            ],
        },
    )
    assert edit_response.status_code == 200, edit_response.text
    edit_body = edit_response.json()
    assert edit_body["success"] is True
    assert edit_body["token"] == token
    assert edit_body["total_confirmados"] == 1

    db = SessionLocal()
    try:
        updated_response = db.scalar(select(RsvpResponse).where(RsvpResponse.group_id == group.id))
        assert updated_response is not None
        assert updated_response.id != response_id_before_edit
        assert updated_response.mensagem == "Atualizamos a resposta"
        assert updated_response.total_confirmados == 1

        updated_statuses = db.scalars(
            select(RsvpMemberStatus).where(RsvpMemberStatus.response_id == updated_response.id)
        ).all()
        assert {status.status for status in updated_statuses} == {
            MemberStatus.AUSENTE,
            MemberStatus.SOMENTE_CERIMONIA,
        }
    finally:
        group_to_delete = db.get(InvitationGroup, group.id)
        if group_to_delete is not None:
            db.delete(group_to_delete)
        db.commit()
        db.close()


def test_confirmation_deadline_blocks_rsvp_and_new_invites(admin_fixture, admin_client):
    unique = admin_fixture["email"].split("@")[0].split(".")[-1]
    public_client = TestClient(app)

    original_settings = admin_client.get("/api/v1/admin/settings/")
    assert original_settings.status_code == 200, original_settings.text
    original_settings_body = original_settings.json()

    group_response = admin_client.post(
        "/api/v1/admin/groups/",
        json={
            "token": f"wave7-{unique}-deadline",
            "nome_grupo": "Grupo Deadline Wave7",
            "observacoes": "teste de prazo",
        },
    )
    assert group_response.status_code == 201, group_response.text
    group_id = group_response.json()["id"]
    group_token = group_response.json()["token"]

    member_response = admin_client.post(
        f"/api/v1/admin/groups/{group_id}/members",
        json={"nome": f"Wave7 Deadline Guest {unique}"},
    )
    assert member_response.status_code == 201, member_response.text
    member_id = member_response.json()["member"]["id"]

    db = SessionLocal()
    try:
        rsvp_response = RsvpResponse(
            group_id=uuid.UUID(group_id),
            mensagem="Antes do prazo",
            total_confirmados=1,
            created_by=admin_fixture["admin_id"],
            updated_by=admin_fixture["admin_id"],
        )
        db.add(rsvp_response)
        db.flush()
        db.add(
            RsvpMemberStatus(
                response_id=rsvp_response.id,
                member_id=uuid.UUID(member_id),
                status=MemberStatus.SOMENTE_CERIMONIA,
                created_by=admin_fixture["admin_id"],
                updated_by=admin_fixture["admin_id"],
            )
        )
        db.commit()
        rsvp_id = rsvp_response.id
    finally:
        db.close()

    settings_update = admin_client.put(
        "/api/v1/admin/settings/",
        json={"rsvp_deadline_offset_days": 400},
    )
    assert settings_update.status_code == 200, settings_update.text
    updated_settings = settings_update.json()["settings"]
    expected_deadline = _normalize_datetime(original_settings_body["data_evento"]) - timedelta(days=400)
    assert _normalize_datetime(updated_settings["confirmation_deadline_at"]) == expected_deadline

    public_event = public_client.get("/api/v1/public/event")
    assert public_event.status_code == 200, public_event.text
    assert public_event.json()["confirmation_deadline_at"] == updated_settings["confirmation_deadline_at"]

    create_group_response = admin_client.post(
        "/api/v1/admin/groups/",
        json={
            "token": f"wave7-{unique}-late-group",
            "nome_grupo": "Grupo Tarde Wave7",
            "observacoes": "depois do prazo",
        },
    )
    assert create_group_response.status_code == 410, create_group_response.text

    open_response = public_client.post(
        "/api/v1/public/rsvp/open",
        json={
            "guest_names": [f"Late Guest {unique}"],
            "message": "Tarde demais",
        },
    )
    assert open_response.status_code == 410, open_response.text

    token_response = public_client.post(
        f"/api/v1/public/rsvp/{group_token}",
        json={
            "message": "Editar depois do prazo",
            "members": [
                {
                    "member_id": member_id,
                    "status": MemberStatus.SOMENTE_CERIMONIA.value,
                }
            ],
        },
    )
    assert token_response.status_code == 410, token_response.text

    create_member_response = admin_client.post(
        f"/api/v1/admin/groups/{group_id}/members",
        json={"nome": f"Late Member {unique}"},
    )
    assert create_member_response.status_code == 410, create_member_response.text

    reset_response = admin_client.delete(f"/api/v1/admin/rsvps/{rsvp_id}")
    assert reset_response.status_code == 410, reset_response.text

    restore_settings = admin_client.put(
        "/api/v1/admin/settings/",
        json={"rsvp_deadline_offset_days": original_settings_body["rsvp_deadline_offset_days"]},
    )
    assert restore_settings.status_code == 200, restore_settings.text


def test_public_rsvp_submission_persists_response(admin_fixture, admin_client):
    unique = admin_fixture["email"].split("@")[0].split(".")[-1]
    token = f"wave7-{unique}-public"

    create_group_response = admin_client.post(
        "/api/v1/admin/groups",
        json={
            "token": token,
            "nome_grupo": f"Wave7 Public Group {unique}",
            "tipo_convite": "CERIMONIA_JANTAR",
            "observacoes": "Grupo para teste de RSVP publico",
        },
    )
    assert create_group_response.status_code == 201, create_group_response.text
    group_id = uuid.UUID(create_group_response.json()["id"])

    member_one_response = admin_client.post(
        f"/api/v1/admin/groups/{group_id}/members",
        json={"nome": f"Wave7 Guest One {unique}"},
    )
    assert member_one_response.status_code == 201, member_one_response.text
    member_one_id = uuid.UUID(member_one_response.json()["member"]["id"])

    member_two_response = admin_client.post(
        f"/api/v1/admin/groups/{group_id}/members",
        json={"nome": f"Wave7 Guest Two {unique}"},
    )
    assert member_two_response.status_code == 201, member_two_response.text
    member_two_id = uuid.UUID(member_two_response.json()["member"]["id"])

    public_client = TestClient(app)
    confirm_response = public_client.post(
        f"/api/v1/public/rsvp/{token}",
        json={
            "message": "Estamos confirmados",
            "members": [
                {"member_id": str(member_one_id), "status": "CERIMONIA_E_JANTAR"},
                {"member_id": str(member_two_id), "status": "AUSENTE"},
            ],
        },
    )
    assert confirm_response.status_code == 200, confirm_response.text
    body = confirm_response.json()
    assert body["success"] is True
    assert body["token"] == token
    assert body["total_confirmados"] == 1

    db = SessionLocal()
    try:
        group = db.scalar(select(InvitationGroup).where(InvitationGroup.id == group_id))
        assert group is not None
        assert group.rsvp_status == RsvpStatus.RESPONDIDO
        assert group.responded_at is not None

        response = db.scalar(select(RsvpResponse).where(RsvpResponse.group_id == group_id))
        assert response is not None
        assert response.mensagem == "Estamos confirmados"
        assert response.total_confirmados == 1

        statuses = db.scalars(
            select(RsvpMemberStatus).where(RsvpMemberStatus.response_id == response.id)
        ).all()
        assert len(statuses) == 2
        assert {status.status for status in statuses} == {
            MemberStatus.CERIMONIA_E_JANTAR,
            MemberStatus.AUSENTE,
        }
    finally:
        db.close()
