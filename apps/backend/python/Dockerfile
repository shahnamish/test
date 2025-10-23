# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir poetry==1.7.1

COPY pyproject.toml ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --only main

COPY src ./src

ENV PYTHONPATH=/app/src
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "audit_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
