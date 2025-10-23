from datetime import date, datetime

from services.kyc_aml import KYCService
from services.kyc_aml.schemas import CustomerProfile, Document


def test_kyc_verification_with_sufficient_documents():
    kyc = KYCService(provider="placeholder")

    customer = CustomerProfile(
        customer_id="customer123",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1980, 1, 1),
        country="US",
        risk_level="low",
        created_at=datetime.utcnow(),
    )

    documents = [
        Document(
            document_type="passport",
            document_number="P123456",
            issued_date=date(2020, 1, 1),
            expiry_date=date(2030, 1, 1),
            country="US",
        ),
        Document(
            document_type="drivers_license",
            document_number="DL987654",
            issued_date=date(2018, 6, 1),
            expiry_date=date(2026, 6, 1),
            country="US",
        ),
    ]

    result = kyc.verify_customer(customer, documents)
    assert result["status"] == "approved"


def test_kyc_verification_requires_manual_review():
    kyc = KYCService(provider="placeholder")

    customer = CustomerProfile(
        customer_id="customer456",
        first_name="Jane",
        last_name="Smith",
        date_of_birth=date(1990, 5, 15),
        country="US",
        risk_level="medium",
        created_at=datetime.utcnow(),
    )

    documents = [
        Document(
            document_type="passport",
            document_number="P654321",
            issued_date=date(2021, 3, 1),
            expiry_date=date(2031, 3, 1),
            country="US",
        ),
    ]

    result = kyc.verify_customer(customer, documents)
    assert result["status"] == "manual_review"
