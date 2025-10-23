#!/usr/bin/env python3
"""
Comprehensive demo of all security and compliance services.
"""

import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.auditing import AuditLogger
from services.kyc_aml import AMLService, KYCService
from services.kyc_aml.schemas import CustomerProfile, Document, Transaction
from services.monitoring import MetricsRegistry
from services.permissions import RBACManager
from services.security import EncryptionService, SecretsManager
from services.security.key_management import InMemoryKeyStore


def demo_audit_logging():
    print("\n=== AUDIT LOGGING DEMO ===")
    audit_logger = AuditLogger()

    event_id = audit_logger.log_event(
        event_type="user.login",
        user_id="demo_user",
        resource="auth_service",
        action="login",
        result="success",
        metadata={"ip": "10.0.1.50", "user_agent": "Mozilla/5.0"},
    )
    print(f"✓ Logged audit event: {event_id}")

    integrity_verified = audit_logger.verify_integrity(event_id)
    print(f"✓ Integrity verification: {integrity_verified}")

    events = audit_logger.query_events(user_id="demo_user")
    print(f"✓ Queried {len(events)} event(s)")
    return audit_logger


def demo_permissions():
    print("\n=== RBAC PERMISSIONS DEMO ===")
    rbac = RBACManager()

    rbac.create_role("admin", permissions=["user:read", "user:write", "audit:export"])
    rbac.create_role("viewer", permissions=["user:read"])
    print("✓ Created roles: admin, viewer")

    rbac.assign_role("alice", "admin")
    rbac.assign_role("bob", "viewer")
    print("✓ Assigned roles to users")

    can_alice_export = rbac.check_permission("alice", "audit:export")
    can_bob_export = rbac.check_permission("bob", "audit:export")
    print(f"✓ Alice can export audits: {can_alice_export}")
    print(f"✓ Bob can export audits: {can_bob_export}")


def demo_kyc_aml(audit_logger):
    print("\n=== KYC/AML DEMO ===")
    kyc_service = KYCService(provider="placeholder", audit_logger=audit_logger)
    aml_service = AMLService(provider="placeholder", audit_logger=audit_logger)

    customer = CustomerProfile(
        customer_id="cust_12345",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1985, 3, 15),
        country="US",
        risk_level="low",
        created_at=datetime.utcnow(),
    )

    documents = [
        Document(
            document_type="passport",
            document_number="P123456789",
            issued_date=date(2020, 1, 15),
            expiry_date=date(2030, 1, 15),
            country="US",
        ),
        Document(
            document_type="drivers_license",
            document_number="DL987654321",
            issued_date=date(2019, 6, 20),
            expiry_date=date(2027, 6, 20),
            country="US",
        ),
    ]

    result = kyc_service.verify_customer(customer, documents)
    print(f"✓ KYC verification result: {result['status']}")

    transaction = Transaction(
        transaction_id="txn_001",
        customer_id="cust_12345",
        amount=15000.0,
        currency="USD",
        timestamp=datetime.utcnow(),
        destination_country="US",
        source_country="US",
        channel="wire_transfer",
    )

    alert = aml_service.evaluate_transaction(transaction)
    if alert:
        print(f"✓ AML alert generated: {alert.alert_id} (severity: {alert.severity})")
    else:
        print("✓ Transaction passed AML checks")


def demo_encryption():
    print("\n=== ENCRYPTION DEMO ===")
    key_store = InMemoryKeyStore()
    encryption_service = EncryptionService(key_store)

    plaintext = b"Sensitive customer data"
    ciphertext = encryption_service.encrypt(plaintext)
    print(f"✓ Encrypted data: {ciphertext[:40]}...")

    decrypted = encryption_service.decrypt(ciphertext)
    print(f"✓ Decrypted data matches: {decrypted == plaintext}")


def demo_secrets_management(audit_logger):
    print("\n=== SECRETS MANAGEMENT DEMO ===")
    secrets_manager = SecretsManager(audit_logger=audit_logger)

    secrets_manager.store_secret("db_password", "super_secure_password", rotation_interval_days=30)
    print("✓ Stored secret: db_password")

    secret_value = secrets_manager.get_secret("db_password")
    print(f"✓ Retrieved secret: {secret_value[:5]}...")

    due_secrets = secrets_manager.secrets_due_for_rotation()
    print(f"✓ Secrets due for rotation: {len(due_secrets)}")


def demo_metrics():
    print("\n=== MONITORING METRICS DEMO ===")
    metrics = MetricsRegistry()

    metrics.record_failed_login("auth_service", "us-east-1")
    print("✓ Recorded failed login metric")

    metrics.set_high_severity_vulnerabilities(3)
    print("✓ Set high severity vulnerabilities: 3")

    metrics.set_kyc_pending_reviews(42)
    print("✓ Set KYC pending reviews: 42")


def main():
    print("=" * 60)
    print("SECURITY, COMPLIANCE, AND AUDITING FRAMEWORK DEMO")
    print("=" * 60)

    audit_logger = demo_audit_logging()
    demo_permissions()
    demo_kyc_aml(audit_logger)
    demo_encryption()
    demo_secrets_management(audit_logger)
    demo_metrics()

    print("\n" + "=" * 60)
    print("✓ ALL DEMOS COMPLETED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    main()
