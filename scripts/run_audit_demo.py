#!/usr/bin/env python3
"""Demo script to showcase audit logging."""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.auditing import AuditLogger
from services.logging import configure_logging


def main() -> int:
    configure_logging()
    logging.getLogger("demo").info("Starting audit logging demo")

    audit_logger = AuditLogger()

    event_id = audit_logger.log_event(
        event_type="user.login",
        user_id="user123",
        resource="auth_service",
        action="login",
        result="success",
        metadata={"ip": "192.168.1.10", "user_agent": "Mozilla/5.0"},
    )

    print(f"Event logged with ID: {event_id}")

    verified = audit_logger.verify_integrity(event_id)
    print(f"Integrity verified: {verified}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
