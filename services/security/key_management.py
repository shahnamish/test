"""Key management utilities."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional

from cryptography.fernet import Fernet

from .encryption_service import EncryptionKey


@dataclass
class KeyRecord:
    key: EncryptionKey
    created_at: datetime
    primary: bool = False


class InMemoryKeyStore:
    """
    Simple key store for demo purposes.

    In production, integrate with HSM, AWS KMS, Azure Key Vault, or GCP KMS.
    """

    def __init__(self, primary_key_id: str = "primary") -> None:
        self.logger = logging.getLogger("security")
        self.primary_key_id = primary_key_id
        self._keys: Dict[str, KeyRecord] = {}

        if primary_key_id not in self._keys:
            self._create_initial_key(primary_key_id)

    def _create_initial_key(self, key_id: str) -> None:
        key_material = Fernet.generate_key()
        encryption_key = EncryptionKey(key_id=key_id, key_material=key_material)
        self._keys[key_id] = KeyRecord(key=encryption_key, created_at=datetime.utcnow(), primary=True)
        self.logger.info("Generated initial key %s", key_id)

    def generate_key(self) -> bytes:
        return Fernet.generate_key()

    def store_key(self, encryption_key: EncryptionKey) -> None:
        record = KeyRecord(key=encryption_key, created_at=datetime.utcnow(), primary=False)
        self._keys[encryption_key.key_id] = record
        self.logger.info("Stored key %s", encryption_key.key_id)

    def get_key(self, key_id: str) -> Optional[EncryptionKey]:
        record = self._keys.get(key_id)
        if record:
            return record.key
        return None

    def promote_to_primary(self, key_id: str) -> None:
        if key_id not in self._keys:
            raise ValueError(f"Key {key_id} not found")

        for record in self._keys.values():
            record.primary = False

        self._keys[key_id].primary = True
        self.primary_key_id = key_id
        self.logger.info("Promoted key %s to primary", key_id)
