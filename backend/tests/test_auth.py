from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from jose import jwt
from sqlalchemy.exc import IntegrityError

from app import auth
from app.config import settings
from app.main import login, me, register
from app.schemas import LoginRequest, RegisterRequest


class FakeResult:
    def __init__(self, row=None, *, lastrowid=None):
        self.row = row
        self.lastrowid = lastrowid

    def mappings(self):
        return self

    def first(self):
        return self.row


class FakeDatabase:
    def __init__(self, rows=(), *, lastrowid=1):
        self.rows = iter(rows)
        self.lastrowid = lastrowid
        self.commits = 0
        self.rollbacks = 0
        self.parameters = []

    def execute(self, statement, params=None):
        self.parameters.append(params)
        return FakeResult(next(self.rows, None), lastrowid=self.lastrowid)

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def test_password_is_hashed_and_verifiable():
    password = "Correct Horse Battery Staple"
    hashed = auth.hash_password(password)

    assert hashed != password
    assert auth.verify_password(password, hashed)
    assert not auth.verify_password("wrong password", hashed)


def test_register_staff_hashes_password_and_returns_safe_profile(monkeypatch):
    database = FakeDatabase()
    monkeypatch.setattr("app.main.hash_password", lambda password: f"hash:{password}")

    response = register(
        RegisterRequest(email="Staff@Example.com", password="password123", clinic_id=201),
        database,
        None,
    )

    assert response == {
        "user_id": 1,
        "email": "staff@example.com",
        "role": "STAFF",
        "clinic_id": 201,
    }
    assert database.commits == 1
    assert database.parameters[0]["password_hash"] == "hash:password123"


def test_admin_registration_requires_admin():
    database = FakeDatabase()

    with pytest.raises(HTTPException) as exc_info:
        register(
            RegisterRequest(email="admin@example.com", password="password123", role="ADMIN"),
            database,
            None,
        )

    assert exc_info.value.status_code == 403


def test_duplicate_registration_returns_conflict():
    class DuplicateDatabase(FakeDatabase):
        def execute(self, statement, params=None):
            raise IntegrityError("duplicate", {}, Exception())

    with pytest.raises(HTTPException) as exc_info:
        register(
            RegisterRequest(email="staff@example.com", password="password123", clinic_id=201),
            DuplicateDatabase(),
            None,
        )

    assert exc_info.value.status_code == 409


def test_staff_cannot_use_admin_dependency():
    dependency = auth.require_roles("ADMIN")

    with pytest.raises(HTTPException) as exc_info:
        dependency({"role": "STAFF"})

    assert exc_info.value.status_code == 403


def test_login_returns_jwt_for_active_user(monkeypatch):
    secret = "a" * 32
    monkeypatch.setattr(settings, "jwt_secret", secret)
    password_hash = auth.hash_password("password123")
    database = FakeDatabase(
        [
            {
                "user_id": 7,
                "email": "staff@example.com",
                "password_hash": password_hash,
                "role": "STAFF",
                "clinic_id": 201,
                "status": "active",
            }
        ]
    )

    response = login(LoginRequest(email="staff@example.com", password="password123"), database)
    payload = jwt.decode(response["access_token"], secret, algorithms=["HS256"])

    assert response["token_type"] == "bearer"
    assert payload["sub"] == "7"
    assert payload["role"] == "STAFF"
    assert payload["clinic_id"] == 201


def test_login_rejects_bad_password_and_inactive_user():
    password_hash = auth.hash_password("password123")
    for status_value, password in (("active", "wrongpass"), ("inactive", "password123")):
        database = FakeDatabase(
            [
                {
                    "user_id": 7,
                    "email": "staff@example.com",
                    "password_hash": password_hash,
                    "role": "STAFF",
                    "clinic_id": 201,
                    "status": status_value,
                }
            ]
        )
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(email="staff@example.com", password=password), database)
        assert exc_info.value.status_code == 401


def test_invalid_and_expired_tokens_are_rejected(monkeypatch):
    monkeypatch.setattr(settings, "jwt_secret", "a" * 32)

    with pytest.raises(HTTPException) as invalid:
        auth.current_user("not-a-jwt")
    assert invalid.value.status_code == 401

    expired = jwt.encode(
        {"sub": "7", "role": "STAFF", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    with pytest.raises(HTTPException) as expired_error:
        auth.current_user(expired)
    assert expired_error.value.status_code == 401


def test_me_returns_safe_profile_without_password_hash():
    database = FakeDatabase(
        [
            {
                "user_id": 7,
                "email": "staff@example.com",
                "role": "STAFF",
                "clinic_id": 201,
                "status": "active",
                "created_at": "created",
                "updated_at": "updated",
            }
        ]
    )

    profile = me({"sub": "7", "role": "STAFF", "clinic_id": 201}, database)

    assert profile["email"] == "staff@example.com"
    assert "password_hash" not in profile
