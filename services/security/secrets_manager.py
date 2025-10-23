"""Secrets management with rotation capabilities."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class Secret:
    name: str
    value: str
    created_at: datetime
    rotated_at: datetime
    rotation_interval_days: int


class SecretsManager:
    """
    Secrets manager with rotation tracking.

    For production, integrate with HashiCorp Vault, AWS Secrets Manager, etc.
    """

    def __init__(self, audit_logger=None):
        self.audit_logger = audit_logger
        self.logger = logging.getLogger("security")
        self._secrets: Dict[str, Secret] = {}

    def store_secret(
        self,
        name: str,
        value: str,
        rotation_interval_days: int = 90,
    ) -> None:
        now = datetime.utcnow()
        secret = Secret(
            name=name,
            value=value,
            created_at=now,
            rotated_at=now,
            rotation_interval_days=rotation_interval_days,
        )
        self._secrets[name] = secret

        if self.audit_logger:
            self.audit_logger.log_event(
                event_type="secrets.stored",
                user_id="system",
                resource=f"secret:{name}",
                action="store",
                result="success",
                metadata={"rotation_interval_days": rotation_interval_days},
            )
        self.logger.info("Secret stored: %s", name)

    def get_secret(self, name: str) -> Optional[str]:
        secret = self._secrets.get(name)
        if not secret:
            return None

        if self.audit_logger:
            self.audit_logger.log_event(
                event_type="secrets.accessed",
                user_id="system",
                resource=f"secret:{name}",
                action="read",
                result="success",
            )

        return secret.value

    def rotate_secret(self, name: str, new_value: str) -> None:
        secret = self._secrets.get(name)
        if not secret:
            raise ValueError(f"Secret {name} not found")

        secret.value = new_value
        secret.rotated_at = datetime.utcnow()

        if self.audit_logger:
            self.audit_logger.log_event(
                event_type="secrets.rotated",
                user_id="system",
                resource=f"secret:{name}",
                action="rotate",
                result="success",
            )

        self.logger.info("Secret rotated: %s", name)

    def secrets_due_for_rotation(self) -> list[str]:
        now = datetime.utcnow()
        due_secrets = []

        for name, secret in self._secrets.items():
            next_rotation_date = secret.rotated_at + timedelta(days=secret.rotation_interval_days)
            if now >= next_rotation_date:
                due_secrets.append(name)

        return due_secrets

    def delete_secret(self, name: str) -> None:
        if name in self._secrets:
            del self._secrets[name]
            if self.audit_logger:
                self.audit_logger.log_event(
                    event_type="secrets.deleted",
                    user_id="system",
                    resource=f"secret:{name}",
                    action="delete",
                    result="success",
                )
            self.logger.info("Secret deleted: %s", name)
