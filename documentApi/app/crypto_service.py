from __future__ import annotations

import base64
import json
import os

from cryptography.fernet import Fernet


class CryptoService:
    """Symmetric encryption using Fernet (AES-128-CBC + HMAC-SHA256)."""

    def __init__(self, key: str | None = None) -> None:
        if key:
            self._key = key.encode() if isinstance(key, str) else key
        else:
            self._key = Fernet.generate_key()
        self._fernet = Fernet(self._key)

    @staticmethod
    def generate_key() -> str:
        return Fernet.generate_key().decode()

    @property
    def key_b64(self) -> str:
        return self._key.decode() if isinstance(self._key, bytes) else self._key

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")

    def encrypt_json(self, data: dict | list) -> str:
        return self.encrypt(json.dumps(data, ensure_ascii=False))

    def decrypt_json(self, ciphertext: str) -> dict | list:
        return json.loads(self.decrypt(ciphertext))
