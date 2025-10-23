"""Role-Based Access Control (RBAC) implementation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, Optional, Set


@dataclass
class Role:
    name: str
    permissions: Set[str] = field(default_factory=set)

    def add_permission(self, permission: str) -> None:
        self.permissions.add(permission)

    def remove_permission(self, permission: str) -> None:
        self.permissions.discard(permission)


class RBACManager:
    """
    In-memory RBAC manager.

    `resource:action` strings represent permissions.
    E.g., `user:read`, `audit:export`, `kyc:approve`.
    """

    def __init__(self) -> None:
        self._roles: Dict[str, Role] = {}
        self._user_roles: Dict[str, Set[str]] = {}

    def create_role(self, role_name: str, permissions: Optional[Iterable[str]] = None) -> Role:
        if role_name in self._roles:
            raise ValueError(f"Role {role_name} already exists")

        role = Role(name=role_name)
        if permissions:
            for permission in permissions:
                role.add_permission(permission)

        self._roles[role_name] = role
        return role

    def assign_role(self, user_id: str, role_name: str) -> None:
        if role_name not in self._roles:
            raise ValueError(f"Role {role_name} does not exist")

        self._user_roles.setdefault(user_id, set()).add(role_name)

    def revoke_role(self, user_id: str, role_name: str) -> None:
        roles = self._user_roles.get(user_id)
        if roles:
            roles.discard(role_name)
            if not roles:
                self._user_roles.pop(user_id, None)

    def check_permission(self, user_id: str, permission: str) -> bool:
        roles = self._user_roles.get(user_id, set())
        for role_name in roles:
            role = self._roles.get(role_name)
            if role and permission in role.permissions:
                return True
        return False

    def get_user_permissions(self, user_id: str) -> Set[str]:
        roles = self._user_roles.get(user_id, set())
        permissions: Set[str] = set()
        for role_name in roles:
            role = self._roles.get(role_name)
            if role:
                permissions.update(role.permissions)
        return permissions

    def export_matrix(self) -> Dict[str, Dict[str, bool]]:
        """Export RBAC matrix for reviews and audits."""
        matrix: Dict[str, Dict[str, bool]] = {}
        for user_id, roles in self._user_roles.items():
            matrix[user_id] = {}
            for role_name in roles:
                role = self._roles.get(role_name)
                if not role:
                    continue
                for permission in role.permissions:
                    matrix[user_id][permission] = True
        return matrix
