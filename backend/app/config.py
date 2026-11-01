from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://@localhost:3306/clinic_management"
    jwt_secret: str = ""
    jwt_expire_minutes: int = 60
    frontend_origin: str = "http://localhost:3000"
    chroma_path: str = "./chroma_data"
    embedding_model: str = "all-MiniLM-L6-v2"
    search_top_k: int = 5
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
