# KYC/AML Compliance Program

## Purpose

Ensure compliance with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations.

## Regulatory Framework

- **Bank Secrecy Act (BSA)**: Customer identification program (CIP) requirements.
- **USA PATRIOT Act**: Enhanced due diligence for high-risk customers.
- **FinCEN Rules**: Reporting suspicious activities, customer verification.
- **International Standards**: FATF Recommendations, EU AML Directives.

## KYC Requirements

### Customer Identification Program (CIP)

1. **Information Collection**:
   - Full legal name
   - Date of birth
   - Physical address
   - Government-issued ID number (SSN, passport)

2. **Verification**:
   - Document verification (passport, driver's license)
   - Non-documentary verification (credit bureau checks, database cross-references)

3. **Risk Rating**:
   - Low risk: Standard verification
   - Medium risk: Enhanced checks
   - High risk: Manual review, senior management approval

### Implementation

```python
from services.kyc_aml import KYCService
from services.kyc_aml.schemas import CustomerProfile, Document

kyc = KYCService(provider="placeholder")
result = kyc.verify_customer(customer, documents)
```

## AML Transaction Monitoring

### Suspicious Activity Indicators

- Large cash transactions (>$10,000)
- Structuring (just below reporting threshold)
- Unusual transaction patterns
- High-risk jurisdictions
- Rapid movement of funds
- Mismatch between transaction and business profile

### Red Flag Scenarios

1. **Geographic Risk**: Transactions to/from sanctioned countries.
2. **Product Risk**: Cross-border wire transfers, large cash deposits.
3. **Channel Risk**: Mobile/online banking used for unusual activity.

### Implementation

```python
from services.kyc_aml import AMLService
from services.kyc_aml.schemas import Transaction

aml = AMLService(provider="placeholder")
alert = aml.evaluate_transaction(transaction)
if alert:
    # Escalate for review
    pass
```

## Reporting

### Suspicious Activity Reports (SARs)

- File within 30 days of detection.
- Document basis for suspicion.
- Coordinate with legal/compliance.

### Currency Transaction Reports (CTRs)

- File for cash transactions >$10,000.
- Automated filing via FinCEN BSA E-Filing System.

## Sanctions Screening

- Screen customers against OFAC SDN list, UN sanctions, and other lists.
- Real-time screening for transactions.
- Monthly re-screening of existing customers.

## Recordkeeping

- KYC records: 5 years after account closure.
- Transaction records: 5 years from transaction date.
- SARs: 5 years from filing date.

## Training

- Annual AML training for all employees.
- Specialized training for compliance, customer service, and risk teams.
- Track completion rates (`employees_missing_training_total` metric).

## Auditing

- Quarterly internal reviews of KYC/AML processes.
- Annual independent audit.
- Continuous monitoring via `services/kyc_aml/` modules.

## Compliance Contacts

- **AML Officer**: aml@example.com
- **Compliance Team**: compliance@example.com
- **Legal**: legal@example.com
