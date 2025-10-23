"""Audit event definitions and schemas."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class AuditEvent:
    """Immutable representation of an audit event."""

    event_type: str
    user_id: str
    resource: str
    action: str
    result: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = field(default=None)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type,
            "user_id": self.user_id,
            "resource": self.resource,
            "action": self.action,
            "result": self.result,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata or {},
        }

    def redact(self, fields: Optional[list[str]] = None) -> "AuditEvent":
        """Return a redacted version for sensitive metadata."""
        if not self.metadata or not fields:
            return self

        redacted_metadata = {key: ("REDACTED" if key in fields else value) for key, value in self.metadata.items()}
        return AuditEvent(
            event_type=self.event_type,
            user_id=self.user_id,
            resource=self.resource,
            action=self.action,
            result=self.result,
            timestamp=self.timestamp,
            metadata=redacted_metadata,
        )
