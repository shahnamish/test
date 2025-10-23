"""Data models for KYC/AML operations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class Document:
    document_type: str
    document_number: str
    issued_date: date
    expiry_date: Optional[date]
    country: str


@dataclass
class CustomerProfile:
    customer_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    country: str
    risk_level: str
    created_at: datetime


@dataclass
class KYCAuditRecord:
    customer_id: str
    status: str
    reviewer_id: Optional[str]
    reviewed_at: Optional[datetime]
    notes: Optional[str]


@dataclass
class Transaction:
    transaction_id: str
    customer_id: str
    amount: float
    currency: str
    timestamp: datetime
    destination_country: str
    source_country: str
    channel: str


@dataclass
class AMLAlert:
    alert_id: str
    transaction_id: str
    customer_id: str
    alert_type: str
    severity: str
    triggered_at: datetime
    status: str
    notes: Optional[str]
