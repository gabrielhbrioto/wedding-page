#!/usr/bin/env python
"""
Script idempotente para popular/atualizar dados do evento em event_settings.

Uso:
    python seed_event_settings.py \
        --nome-casal "Gabriel & Débora" \
        --data-evento "2027-04-10T16:00:00" \
        --local-nome "Igreja Presbiteriana Filadélfia" \
        --endereco "São Carlos, SP" \
        --gift-list-url "https://site-de-lista.com/slug" \
        --google-maps-url "https://maps.app.goo.gl/..." \
        --mensagem-home "Bem-vindos ao nosso casamento!"
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

# Adicionar app ao path para imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.event_setting import EventSetting


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed (ou update idempotente) a configuracao de evento.",
    )
    parser.add_argument(
        "--nome-casal",
        required=True,
        help="Nome do casal (ex: Gabriel & Debora)",
    )
    parser.add_argument(
        "--data-evento",
        required=True,
        help="Data e hora do evento (ISO format: 2027-04-10T16:00:00)",
    )
    parser.add_argument(
        "--local-nome",
        default=None,
        help="Nome do local (ex: Igreja Presbiteriana Filadélfia)",
    )
    parser.add_argument(
        "--endereco",
        default=None,
        help="Endereço completo",
    )
    parser.add_argument(
        "--google-maps-url",
        default=None,
        help="URL do Google Maps para o local",
    )
    parser.add_argument(
        "--gift-list-url",
        default=None,
        help="URL externa da lista de presentes",
    )
    parser.add_argument(
        "--mensagem-home",
        default=None,
        help="Mensagem customizada para homepage",
    )
    parser.add_argument(
        "--rsvp-deadline-offset-days",
        type=int,
        default=None,
        help="Quantidade de dias antes do evento para encerrar a confirmacao de presenca",
    )
    return parser.parse_args()


def seed_event(
    *,
    nome_casal: str,
    data_evento: str,
    local_nome: str | None,
    endereco: str | None,
    gift_list_url: str | None,
    google_maps_url: str | None,
    mensagem_home: str | None,
    rsvp_deadline_offset_days: int | None,
) -> None:
    """Cria ou atualiza registro de event_settings de forma idempotente."""
    try:
        data_evento_dt = datetime.fromisoformat(data_evento)
    except ValueError as exc:
        raise ValueError(
            f"Data inválida: {data_evento}. Use ISO format (2027-04-10T16:00:00)."
        ) from exc

    db = SessionLocal()
    try:
        # Verificar se já existe registro
        existing = db.scalar(select(EventSetting).order_by(EventSetting.created_at.asc()).limit(1))

        if existing:
            # atualizar
            existing.nome_casal = nome_casal
            existing.data_evento = data_evento_dt
            if local_nome is not None:
                existing.local_nome = local_nome
            if endereco is not None:
                existing.endereco = endereco
            if google_maps_url is not None:
                existing.google_maps_url = google_maps_url
            if gift_list_url is not None:
                existing.gift_list_url = gift_list_url
            if mensagem_home is not None:
                existing.mensagem_home = mensagem_home
            if rsvp_deadline_offset_days is not None:
                existing.rsvp_deadline_offset_days = rsvp_deadline_offset_days
            existing.ativo = True

            db.commit()
            db.refresh(existing)
            print(f"✓ Evento atualizado: id={existing.id} casal={existing.nome_casal}")
        else:
            # criar
            created = EventSetting(
                nome_casal=nome_casal,
                data_evento=data_evento_dt,
                local_nome=local_nome,
                endereco=endereco,
                google_maps_url=google_maps_url,
                gift_list_url=gift_list_url,
                mensagem_home=mensagem_home,
                rsvp_deadline_offset_days=rsvp_deadline_offset_days,
                ativo=True,
            )
            db.add(created)
            db.commit()
            db.refresh(created)
            print(f"✓ Evento criado: id={created.id} casal={created.nome_casal}")
    finally:
        db.close()


def main() -> None:
    args = _parse_args()
    try:
        seed_event(
            nome_casal=args.nome_casal,
            data_evento=args.data_evento,
            local_nome=args.local_nome,
            endereco=args.endereco,
            gift_list_url=args.gift_list_url,
            google_maps_url=args.google_maps_url,
            mensagem_home=args.mensagem_home,
            rsvp_deadline_offset_days=args.rsvp_deadline_offset_days,
        )
    except OperationalError as exc:
        print(
            f"✗ Falha ao conectar no banco de dados.",
            file=sys.stderr,
        )
        print(f"  DATABASE_URL: {settings.DATABASE_URL}", file=sys.stderr)
        print(f"  Erro: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    except ValueError as exc:
        print(f"✗ {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
