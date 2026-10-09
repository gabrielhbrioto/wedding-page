import os
import requests

# Variáveis de Ambiente esperadas na Cloud Function
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
BACKEND_URL = os.environ.get("BACKEND_URL")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

def send_telegram_message(text: str):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram configs not set. Skipping message:", text)
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"Failed to send telegram message: {e}")

def check_services(request):
    """
    HTTP Cloud Function entry point.
    """
    errors = []

    # 1. Check Supabase
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            # Faz uma query simples em alguma tabela pública ou na REST API base
            # Ex: "/rest/v1/event_settings?select=id&limit=1"eventos?limit=1 ou apenas checando a resposta da API
            headers = {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
            # Acessar a raiz da REST API retorna a doc do OpenAPI se estiver de pé
            res = requests.get(f"{SUPABASE_URL}/rest/v1/event_settings?select=id&limit=1", headers=headers, timeout=10)
            if res.status_code != 200:
                errors.append(f"Supabase retornou status {res.status_code}")
        except Exception as e:
            errors.append(f"Erro ao conectar no Supabase: {str(e)}")

    # 2. Check Backend
    if BACKEND_URL:
        try:
            health_url = f"{BACKEND_URL.rstrip('/')}/health"
            res = requests.get(health_url, timeout=10)
            if res.status_code != 200:
                errors.append(f"Backend (/health) retornou status {res.status_code}")
        except Exception as e:
            errors.append(f"Erro ao conectar no Backend: {str(e)}")

    if errors:
        error_msg = "🚨 <b>Alerta do Casamento!</b>\nAlgum serviço parece estar fora do ar:\n\n"
        error_msg += "\n".join([f"• {e}" for e in errors])
        send_telegram_message(error_msg)
        return ("Serviços com erro reportados via Telegram", 500)
    
    return ("Tudo OK!", 200)

