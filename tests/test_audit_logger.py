from services.auditing import AuditLogger


def test_audit_logging_round_trip():
    audit_logger = AuditLogger()
    event_id = audit_logger.log_event(
        event_type="user.test",
        user_id="user123",
        resource="test_service",
        action="execute",
        result="success",
        metadata={"detail": "test"},
    )

    assert audit_logger.verify_integrity(event_id) is True
    events = audit_logger.query_events(user_id="user123")
    assert len(events) == 1
    assert events[0].event_type == "user.test"
