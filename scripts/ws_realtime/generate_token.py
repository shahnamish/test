#!/usr/bin/env python3
"""Generate short-lived JWT tokens for the ws-realtime service."""

from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import sys
import time
from typing import Any, Dict

HEADER = {"alg": "HS256", "typ": "JWT"}


def b64url(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def encode(payload: Dict[str, Any], secret: str) -> str:
    header_segment = b64url(json.dumps(HEADER, separators=(",", ":")).encode("utf-8"))
    payload_segment = b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = b".".join([header_segment, payload_segment])
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_segment = b64url(signature)
    return b".".join([signing_input, signature_segment]).decode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a JWT for the ws-realtime service")
    parser.add_argument("secret", help="HS256 signing secret (matches WS_AUTH_SECRET)")
    parser.add_argument("subject", help="User identifier (becomes the 'sub' claim)")
    parser.add_argument("--ttl", type=int, default=3600, help="Token lifetime in seconds (default: 3600)")
    parser.add_argument("--aud", dest="audience", help="Optional audience claim")

    args = parser.parse_args()

    now = int(time.time())
    payload: Dict[str, Any] = {
        "sub": args.subject,
        "iat": now,
        "exp": now + args.ttl,
    }

    if args.audience:
        payload["aud"] = args.audience

    token = encode(payload, args.secret)
    print(token)
    return 0


if __name__ == "__main__":
    sys.exit(main())
