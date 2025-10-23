"""Monitoring metrics registry."""

from prometheus_client import Counter, Gauge, Histogram


class MetricsRegistry:
    """Central registry for security and compliance metrics."""

    def __init__(self) -> None:
        self.failed_logins = Counter(
            "failed_login_attempts_total",
            "Total number of failed login attempts",
            ["service", "region"],
        )
        self.unauthorized_access = Counter(
            "unauthorized_access_attempts_total",
            "Unauthorized access attempts",
            ["service", "resource"],
        )
        self.data_transfer = Histogram(
            "data_transfer_bytes",
            "Data transfer volume",
            buckets=(1024, 10 * 1024, 100 * 1024, 1024 * 1024, 10 * 1024 * 1024),
        )
        self.encryption_failures = Counter(
            "encryption_failures_total",
            "Number of encryption failures",
            ["service"],
        )
        self.secret_access = Counter(
            "secret_access_total",
            "Secrets access operations",
            ["secret_name", "action"],
        )
        self.privilege_escalation = Counter(
            "privilege_escalation_attempts_total",
            "Privilege escalation attempts",
            ["user_id"],
        )
        self.high_severity_vulnerabilities = Gauge(
            "high_severity_vulnerabilities_total",
            "High severity vulnerabilities detected",
        )
        self.audit_log_write_failures = Counter(
            "audit_log_write_failures_total",
            "Audit log write failures",
        )
        self.ssl_certificate_expiry = Gauge(
            "ssl_certificate_expiry_days",
            "Days until SSL certificate expiration",
            ["cert_name"],
        )
        self.audit_log_ingestion_delay = Gauge(
            "audit_log_ingestion_delay_seconds",
            "Delay in audit log ingestion",
        )
        self.kyc_pending_reviews = Gauge(
            "kyc_pending_reviews_total",
            "Number of pending KYC reviews",
        )
        self.aml_alerts_pending = Gauge(
            "aml_alerts_pending_review_total",
            "Pending AML alerts",
        )
        self.policy_document_expiry = Gauge(
            "policy_document_expiry_days",
            "Days until policy document expires",
            ["policy_name"],
        )
        self.secrets_rotation_overdue = Gauge(
            "secrets_rotation_overdue_total",
            "Secrets overdue for rotation",
        )
        self.employees_missing_training = Gauge(
            "employees_missing_training_total",
            "Employees missing required training",
        )

    def record_failed_login(self, service: str, region: str) -> None:
        self.failed_logins.labels(service=service, region=region).inc()

    def record_unauthorized_access(self, service: str, resource: str) -> None:
        self.unauthorized_access.labels(service=service, resource=resource).inc()

    def record_data_transfer(self, amount_bytes: float) -> None:
        self.data_transfer.observe(amount_bytes)

    def record_encryption_failure(self, service: str) -> None:
        self.encryption_failures.labels(service=service).inc()

    def record_secret_access(self, secret_name: str, action: str) -> None:
        self.secret_access.labels(secret_name=secret_name, action=action).inc()

    def record_privilege_escalation_attempt(self, user_id: str) -> None:
        self.privilege_escalation.labels(user_id=user_id).inc()

    def set_high_severity_vulnerabilities(self, count: int) -> None:
        self.high_severity_vulnerabilities.set(count)

    def record_audit_log_failure(self) -> None:
        self.audit_log_write_failures.inc()

    def set_ssl_certificate_expiry(self, cert_name: str, days_remaining: int) -> None:
        self.ssl_certificate_expiry.labels(cert_name=cert_name).set(days_remaining)

    def set_audit_log_ingestion_delay(self, delay_seconds: float) -> None:
        self.audit_log_ingestion_delay.set(delay_seconds)

    def set_kyc_pending_reviews(self, count: int) -> None:
        self.kyc_pending_reviews.set(count)

    def set_aml_alerts_pending(self, count: int) -> None:
        self.aml_alerts_pending.set(count)

    def set_policy_document_expiry(self, policy_name: str, days_remaining: int) -> None:
        self.policy_document_expiry.labels(policy_name=policy_name).set(days_remaining)

    def set_secrets_rotation_overdue(self, count: int) -> None:
        self.secrets_rotation_overdue.set(count)

    def set_employees_missing_training(self, count: int) -> None:
        self.employees_missing_training.set(count)
