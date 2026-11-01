from sqlalchemy.engine import make_url

from app.config import Settings


def test_default_database_url_targets_mysql_database():
    url = make_url(Settings().database_url)

    assert url.drivername == "mysql+pymysql"
    assert url.host == "localhost"
    assert url.port == 3306
    assert url.database == "clinic_management"


def test_database_url_can_be_overridden(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL",
        "mysql+pymysql://test_user:test_password@db.example:3307/test_db",
    )

    url = make_url(Settings().database_url)

    assert url.username == "test_user"
    assert url.host == "db.example"
    assert url.port == 3307
    assert url.database == "test_db"
