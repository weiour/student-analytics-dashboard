import os
from gigachat import GigaChat

def make_client() -> GigaChat:
    creds = os.getenv("GIGACHAT_CREDENTIALS")
    if not creds:
        raise RuntimeError("Не задан GIGACHAT_CREDENTIALS (Authorization key)")

    # Dev-only: можно отключить SSL проверку переменной окружения
    verify_env = os.getenv("GIGACHAT_VERIFY_SSL_CERTS")
    verify_ssl = True
    if verify_env is not None and verify_env.lower() in ("0", "false", "no"):
        verify_ssl = False

    ca_bundle = os.getenv("GIGACHAT_CA_BUNDLE_FILE")  # если нужен корневой сертификат
    return GigaChat(
        credentials=creds,
        verify_ssl_certs=verify_ssl,
        ca_bundle_file=ca_bundle,
    )
