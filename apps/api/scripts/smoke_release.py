from __future__ import annotations

import argparse
import time
import uuid

import httpx


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Smoke test autenticado para rollout da Onda 8.",
    )
    parser.add_argument("--base-url", required=True, help="URL base da API (ex.: https://api-staging.exemplo.com)")
    parser.add_argument("--email", required=True, help="Email admin para login")
    parser.add_argument("--password", required=True, help="Senha admin para login")
    parser.add_argument("--timeout", type=float, default=15.0, help="Timeout HTTP em segundos")
    return parser.parse_args()


def _assert_status(response: httpx.Response, expected: int, context: str) -> None:
    if response.status_code != expected:
        raise RuntimeError(
            f"{context}: esperado HTTP {expected}, recebido {response.status_code}. Corpo: {response.text}",
        )


def main() -> None:
    args = _parse_args()
    base_url = args.base_url.rstrip("/")

    run_id = f"wave8-{int(time.time())}-{uuid.uuid4().hex[:6]}"
    temp_group_token = f"{run_id}-group"
    temp_gift_name = f"{run_id}-gift"

    with httpx.Client(base_url=base_url, timeout=args.timeout, follow_redirects=True) as client:
        health = client.get("/")
        _assert_status(health, 200, "health")

        login = client.post(
            "/api/v1/admin/auth/login",
            json={
                "email": args.email,
                "password": args.password,
                "remember_me": False,
            },
        )
        _assert_status(login, 200, "login")

        me = client.get("/api/v1/admin/auth/me")
        _assert_status(me, 200, "auth/me")

        dashboard = client.get("/api/v1/admin/dashboard/")
        _assert_status(dashboard, 200, "dashboard")

        stats_presence = client.get("/api/v1/admin/stats/presence")
        _assert_status(stats_presence, 200, "stats/presence")

        stats_gifts = client.get("/api/v1/admin/stats/gifts")
        _assert_status(stats_gifts, 200, "stats/gifts")

        group_create = client.post(
            "/api/v1/admin/groups/",
            json={
                "token": temp_group_token,
                "nome_grupo": f"{run_id}-grupo",
                "tipo_convite": "CERIMONIA",
            },
        )
        _assert_status(group_create, 201, "groups/create")
        group_id = group_create.json().get("id")
        if not group_id:
            raise RuntimeError("groups/create: resposta sem id")

        group_delete = client.delete(f"/api/v1/admin/groups/{group_id}")
        _assert_status(group_delete, 200, "groups/delete")

        gift_create = client.post(
            "/api/v1/admin/gifts/",
            json={
                "nome": temp_gift_name,
                "descricao": "smoke rollout onda 8",
                "preco": 99.99,
                "ativo": True,
                "ordem": 999,
            },
        )
        _assert_status(gift_create, 201, "gifts/create")
        gift_id = gift_create.json().get("id")
        if not gift_id:
            raise RuntimeError("gifts/create: resposta sem id")

        gift_delete = client.delete(f"/api/v1/admin/gifts/{gift_id}")
        _assert_status(gift_delete, 200, "gifts/delete")

    print("[Wave8] Smoke concluido com sucesso")
    print(f"- base_url: {base_url}")
    print(f"- run_id: {run_id}")


if __name__ == "__main__":
    main()
