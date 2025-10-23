from fastapi import FastAPI, status

app = FastAPI(title="Audit Service", version="0.1.0")


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """Return service health information."""
    return {"status": "ok"}


@app.post("/api/v1/audit/events", status_code=status.HTTP_202_ACCEPTED)
async def create_audit_event(event: dict) -> dict[str, dict]:
    """Accept an audit event payload and simulate persistence."""
    return {"message": "Event received", "event": event}
