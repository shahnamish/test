"""Audit repository for storing audit events."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Dict, Iterable, Optional

from .audit_event import AuditEvent


class AuditRepository:
    """
    In-memory audit repository with append-only storage.

    For production, integrate with append-only data stores such as AWS QLDB,
    Apache Kafka, or immutability services (e.g., AWS CloudTrail).
    """

    def __init__(self):
        self._storage: Dict[str, AuditEvent] = {}
        self._index_user: defaultdict[str, set[str]] = defaultdict(set)
        self._index_resource: defaultdict[str, set[str]] = defaultdict(set)
        self._index_event_type: defaultdict[str, set[str]] = defaultdict(set)

    def store(self, event_id: str, event: AuditEvent) -> None:
        if event_id in self._storage:
            raise ValueError(f"Audit event with ID {event_id} already exists")

        self._storage[event_id] = event
        self._index_user[event.user_id].add(event_id)
        self._index_resource[event.resource].add(event_id)
        self._index_event_type[event.event_type].add(event_id)

    def retrieve(self, event_id: str) -> Optional[AuditEvent]:
        return self._storage.get(event_id)

    def query(
        self,
        user_id: Optional[str] = None,
        resource: Optional[str] = None,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> list[AuditEvent]:
        """Query audit events using simple filtering."""
        candidate_ids = self._candidate_ids(user_id, resource, event_type)
        events = [self._storage[event_id] for event_id in candidate_ids]

        def _within_time_bounds(event: AuditEvent) -> bool:
            if start_time and event.timestamp < start_time:
                return False
            if end_time and event.timestamp > end_time:
                return False
            return True

        return [event for event in events if _within_time_bounds(event)]

    def _candidate_ids(
        self,
        user_id: Optional[str],
        resource: Optional[str],
        event_type: Optional[str],
    ) -> Iterable[str]:
        sets = []
        if user_id:
            sets.append(self._index_user.get(user_id, set()))
        if resource:
            sets.append(self._index_resource.get(resource, set()))
        if event_type:
            sets.append(self._index_event_type.get(event_type, set()))

        if not sets:
            return self._storage.keys()

        candidate_set = sets[0].copy()
        for s in sets[1:]:
            candidate_set &= s
        return candidate_set
