"""Encryption services for data at rest and in transit."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

try:
    from cryptography.fernet import Fernet
except Exception:  # pragma: no cover - fallback when library unavailable
    Fernet = None


@dataclass
class EncryptionKey:
    key_id: str
    key_material: bytes
    algorithm: str = "Fernet"


class EncryptionService:
    def __init__(self, key_store, key_rotation_days: int = 90):
        self.key_store = key_store
        self.key_rotation_days = key_rotation_days
        self.logger = logging.getLogger("security")

    def encrypt(self, plaintext: bytes, key_id: Optional[str] = None) -> bytes:
        key = self._get_key(key_id)
        if key.algorithm == "Fernet" and Fernet:
            f = Fernet(key.key_material)
            ciphertext = f.encrypt(plaintext)
            self.logger.debug("Data encrypted with key %s", key.key_id)
            return ciphertext
        raise RuntimeError("Unsupported encryption algorithm or missing dependency")

    def decrypt(self, ciphertext: bytes, key_id: Optional[str] = None) -> bytes:
        key = self._get_key(key_id)
        if key.algorithm == "Fernet" and Fernet:
            f = Fernet(key.key_material)
            plaintext = f.decrypt(ciphertext)
            self.logger.debug("Data decrypted with key %s", key.key_id)
            return plaintext
        raise RuntimeError("Unsupported encryption algorithm or missing dependency")

    def rotate_key(self, key_id: Optional[str] = None) -> EncryptionKey:
        new_key_material = self.key_store.generate_key()
        key_id = key_id or self.key_store.primary_key_id
        key = EncryptionKey(key_id=key_id, key_material=new_key_material)
        self.key_store.store_key(key)
        self.logger.info("Rotated encryption key %s", key_id)
        return key

    def _get_key(self, key_id: Optional[str]) -> EncryptionKey:
        key_id = key_id or self.key_store.primary_key_id
        key = self.key_store.get_key(key_id)
        if not key:
            raise ValueError(f"Key {key_id} not found")
        return key
