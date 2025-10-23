from services.permissions import RBACManager


def test_rbac_permission_check():
    rbac = RBACManager()

    rbac.create_role("admin", permissions=["user:read", "user:write", "user:delete"])
    rbac.create_role("viewer", permissions=["user:read"])

    rbac.assign_role("alice", "admin")
    rbac.assign_role("bob", "viewer")

    assert rbac.check_permission("alice", "user:delete") is True
    assert rbac.check_permission("bob", "user:delete") is False
    assert rbac.check_permission("bob", "user:read") is True


def test_rbac_revoke_role():
    rbac = RBACManager()
    rbac.create_role("admin", permissions=["user:delete"])
    rbac.assign_role("charlie", "admin")

    assert rbac.check_permission("charlie", "user:delete") is True

    rbac.revoke_role("charlie", "admin")
    assert rbac.check_permission("charlie", "user:delete") is False
