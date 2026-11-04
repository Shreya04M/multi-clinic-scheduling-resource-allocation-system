from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://root:@localhost:3306/clinic_management"
    jwt_secret: str = ""
    jwt_expire_minutes: int = 60
    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    chroma_path: str = "./chroma_data"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    search_top_k: int = 5
    search_max_distance: float = 0.8
    model_config = SettingsConfigDict(
    env_file=Path(__file__).resolve().parents[1] / ".env",
    extra="ignore"
)

settings = Settings()
