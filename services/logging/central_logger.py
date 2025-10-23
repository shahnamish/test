"""Centralized logging configuration."""

import logging
import logging.config
from pathlib import Path
from typing import Optional

import yaml


def configure_logging(config_path: Optional[str] = None) -> None:
    """
    Configure centralized logging from YAML configuration.

    Args:
        config_path: Path to logging configuration file (default: config/logging/logging.yaml).
    """
    if config_path is None:
        config_path = "config/logging/logging.yaml"

    config_file = Path(config_path)
    if not config_file.exists():
        logging.basicConfig(level=logging.INFO)
        logging.warning("Logging configuration file not found: %s", config_path)
        return

    with config_file.open("r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    logging.config.dictConfig(config)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)
