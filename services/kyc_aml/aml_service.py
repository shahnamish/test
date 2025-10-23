"""Anti-Money Laundering (AML) monitoring service."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List, Optional

from .schemas import AMLAlert, Transaction


class AMLService:
    """
    AML service for transaction monitoring and alerting.

    Detects suspicious transactions and escalates for review.
    """

    def __init__(self, provider: str = "placeholder", audit_logger=None):
        self.provider = provider
        self.audit_logger = audit_logger
        self.logger = logging.getLogger("aml")
        self._alerts: Dict[str, AMLAlert] = {}

    def evaluate_transaction(self, transaction: Transaction) -> Optional[AMLAlert]:
        """
        Evaluate transaction for suspicious activity.

        Returns:
            AMLAlert if suspicious, otherwise None.
        """
        self.logger.debug("Evaluating transaction %s", transaction.transaction_id)

        if self.provider == "placeholder":
            alert = self._placeholder_detection(transaction)
        else:
            alert = self._third_party_detection(transaction)

        if alert:
            self._alerts[alert.alert_id] = alert
            if self.audit_logger:
                self.audit_logger.log_event(
                    event_type="aml.alert",
                    user_id=transaction.customer_id,
                    resource="transaction_monitoring",
                    action="alert",
                    result=alert.severity,
                    metadata={
                        "alert_id": alert.alert_id,
                        "transaction_id": transaction.transaction_id,
                        "amount": transaction.amount,
                        "currency": transaction.currency,
                    },
                )
            self.logger.warning(
                "AML alert generated", extra={"alert_id": alert.alert_id, "severity": alert.severity}
            )

        return alert

    def _placeholder_detection(self, transaction: Transaction) -> Optional[AMLAlert]:
        """Basic rule-based detection placeholder."""
        thresholds = {
            "default": 10000,
            "high_risk_country": 5000,
        }

        high_risk_countries = {"IR", "SY", "KP", "CU"}
        threshold = thresholds["default"]
        reason = None

        if transaction.destination_country in high_risk_countries:
            threshold = thresholds["high_risk_country"]
            reason = "High-risk destination country"
        elif transaction.amount > thresholds["default"]:
            reason = "High-value transaction"

        if reason:
            alert_id = f"ALERT-{transaction.transaction_id}"
            return AMLAlert(
                alert_id=alert_id,
                transaction_id=transaction.transaction_id,
                customer_id=transaction.customer_id,
                alert_type="suspicious_transaction",
                severity="high" if threshold == thresholds["high_risk_country"] else "medium",
                triggered_at=datetime.utcnow(),
                status="open",
                notes=reason,
            )

        return None

    def _third_party_detection(self, transaction: Transaction) -> Optional[AMLAlert]:
        """
        Placeholder for third-party AML integrations.
        """
        raise NotImplementedError(f"Third-party provider {self.provider} not implemented")

    def resolve_alert(self, alert_id: str, reviewer_id: str, notes: Optional[str] = None) -> None:
        alert = self._alerts.get(alert_id)
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.status = "resolved"
        alert.notes = notes

        if self.audit_logger:
            self.audit_logger.log_event(
                event_type="aml.alert_resolved",
                user_id=reviewer_id,
                resource=f"alert:{alert_id}",
                action="resolve",
                result="resolved",
                metadata={"notes": notes or ""},
            )

        self.logger.info("Resolved AML alert %s", alert_id)

    def pending_alerts(self) -> List[AMLAlert]:
        return [alert for alert in self._alerts.values() if alert.status != "resolved"]
