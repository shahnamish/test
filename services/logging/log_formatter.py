"""Logging filters and formatters."""

import logging
import socket
import threading
from datetime import datetime


class ContextFilter(logging.Filter):
    """Inject contextual information into log records."""

    def __init__(self, environment: str = "production") -> None:
        super().__init__()
        self.environment = environment
        self.hostname = socket.gethostname()

    def filter(self, record: logging.LogRecord) -> bool:
        record.environment = self.environment
        record.hostname = self.hostname
        record.thread_id = threading.get_ident()
        record.timestamp = datetime.utcnow().isoformat()
        return True
