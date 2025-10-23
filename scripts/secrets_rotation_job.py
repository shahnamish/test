#!/usr/bin/env python3
"""
Automated secrets rotation job.

This script rotates secrets based on rotation policies.
"""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.auditing import AuditLogger
from services.security import SecretsManager


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("secrets_rotation")

    audit_logger = AuditLogger()
    secrets_manager = SecretsManager(audit_logger=audit_logger)

    secrets_manager.store_secret("db_password", "initial_password", rotation_interval_days=30)
    secrets_manager.store_secret("api_key", "initial_api_key", rotation_interval_days=60)
    secrets_manager.store_secret("encryption_key", "initial_encryption_key", rotation_interval_days=90)

    due_secrets = secrets_manager.secrets_due_for_rotation()

    if not due_secrets:
        logger.info("No secrets due for rotation")
        return 0

    logger.info("Secrets due for rotation: %s", due_secrets)

    for secret_name in due_secrets:
        logger.info("Rotating secret: %s", secret_name)
        new_value = f"rotated_{secret_name}_value"
        secrets_manager.rotate_secret(secret_name, new_value)

    logger.info("Secrets rotation completed successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
