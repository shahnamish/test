"""Centralized audit logging service."""

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from .audit_event import AuditEvent
from .audit_repository import AuditRepository


class AuditLogger:
    """Centralized audit logging with immutability and integrity checks."""

    def __init__(self, repository: Optional[AuditRepository] = None):
        self.repository = repository or AuditRepository()
        self.logger = logging.getLogger("audit")

    def log_event(
        self,
        event_type: str,
        user_id: str,
        resource: str,
        action: str,
        result: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Log an audit event with integrity hash.

        Args:
            event_type: Type of event (e.g., user.login, data.access, permission.change).
            user_id: User performing the action.
            resource: Resource affected (e.g., API endpoint, data record).
            action: Action performed (e.g., create, read, update, delete).
            result: Outcome (success, failure, error).
            metadata: Additional context (IP, user_agent, etc).

        Returns:
            Unique event ID.
        """
        event = AuditEvent(
            event_type=event_type,
            user_id=user_id,
            resource=resource,
            action=action,
            result=result,
            timestamp=datetime.utcnow(),
            metadata=metadata,
        )

        event_id = self._compute_hash(event)

        self.logger.info(
            "Audit event logged",
            extra={
                "event_id": event_id,
                "event_type": event_type,
                "user_id": user_id,
                "resource": resource,
                "action": action,
                "result": result,
                "metadata": metadata or {},
            },
        )

        self.repository.store(event_id, event)

        return event_id

    def _compute_hash(self, event: AuditEvent) -> str:
        """Compute integrity hash for the audit event."""
        event_str = json.dumps(event.to_dict(), sort_keys=True)
        return hashlib.sha256(event_str.encode()).hexdigest()

    def verify_integrity(self, event_id: str) -> bool:
        """Verify the integrity of a stored audit event."""
        event = self.repository.retrieve(event_id)
        if not event:
            return False

        computed_hash = self._compute_hash(event)
        return computed_hash == event_id

    def query_events(
        self,
        user_id: Optional[str] = None,
        resource: Optional[str] = None,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> list[AuditEvent]:
        """Query audit events by various filters."""
        return self.repository.query(
            user_id=user_id,
            resource=resource,
            event_type=event_type,
            start_time=start_time,
            end_time=end_time,
        )
