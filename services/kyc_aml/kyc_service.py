"""Know Your Customer (KYC) compliance service."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List, Optional

from .schemas import CustomerProfile, Document, KYCAuditRecord


class KYCService:
    """
    KYC compliance service with placeholders for third-party integration.

    Integration points for Jumio, Onfido, Sumsub, etc.
    """

    def __init__(self, provider: str = "placeholder", audit_logger=None):
        self.provider = provider
        self.audit_logger = audit_logger
        self.logger = logging.getLogger("kyc")
        self._pending_reviews: List[str] = []

    def verify_customer(
        self,
        customer: CustomerProfile,
        documents: List[Document],
    ) -> Dict[str, str]:
        """
        Verify customer identity against provided documents.

        Args:
            customer: Customer profile.
            documents: List of supporting documents.

        Returns:
            Verification result with status and details.
        """
        self.logger.info(f"Starting KYC verification for customer {customer.customer_id}")

        if self.provider == "placeholder":
            result = self._placeholder_verification(customer, documents)
        else:
            result = self._third_party_verification(customer, documents)

        if self.audit_logger:
            self.audit_logger.log_event(
                event_type="kyc.verification",
                user_id=customer.customer_id,
                resource="kyc_service",
                action="verify",
                result=result["status"],
                metadata={"provider": self.provider, "documents_count": len(documents)},
            )

        return result

    def _placeholder_verification(
        self,
        customer: CustomerProfile,
        documents: List[Document],
    ) -> Dict[str, str]:
        """Placeholder verification logic."""
        if len(documents) >= 2:
            status = "approved"
            details = "Customer passed automated verification"
        else:
            status = "manual_review"
            details = "Insufficient documents for automated verification"
            self._pending_reviews.append(customer.customer_id)

        return {
            "status": status,
            "customer_id": customer.customer_id,
            "details": details,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _third_party_verification(
        self,
        customer: CustomerProfile,
        documents: List[Document],
    ) -> Dict[str, str]:
        """
        Integration with third-party KYC provider.

        Implement API calls to Jumio, Onfido, Sumsub based on provider config.
        """
        raise NotImplementedError(f"Third-party provider {self.provider} not implemented")

    def review_kyc(
        self,
        customer_id: str,
        reviewer_id: str,
        approved: bool,
        notes: Optional[str] = None,
    ) -> KYCAuditRecord:
        """
        Manual review of KYC submission.

        Args:
            customer_id: Customer being reviewed.
            reviewer_id: User performing review.
            approved: Whether customer is approved.
            notes: Reviewer notes.

        Returns:
            Audit record of review.
        """
        status = "approved" if approved else "rejected"
        audit_record = KYCAuditRecord(
            customer_id=customer_id,
            status=status,
            reviewer_id=reviewer_id,
            reviewed_at=datetime.utcnow(),
            notes=notes,
        )

        if customer_id in self._pending_reviews:
            self._pending_reviews.remove(customer_id)

        if self.audit_logger:
            self.audit_logger.log_event(
                event_type="kyc.review",
                user_id=reviewer_id,
                resource=f"customer:{customer_id}",
                action="review",
                result=status,
                metadata={"notes": notes or ""},
            )

        self.logger.info(f"KYC review completed: {customer_id} - {status}")
        return audit_record

    def get_pending_reviews_count(self) -> int:
        """Get count of pending KYC reviews."""
        return len(self._pending_reviews)
