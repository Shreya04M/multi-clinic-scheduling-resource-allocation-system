from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_token(subject: str, role: str, clinic_id: int | None = None) -> str:
    if len(settings.jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must be configured with at least 32 characters")
    payload = {"sub": subject, "role": role, "clinic_id": clinic_id, "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def _decode_token(token: str | None) -> dict:
    credentials = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token")
    if not token:
        raise credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if not payload.get("sub") or not payload.get("role"):
            raise credentials
        return payload
    except JWTError as exc:
        raise credentials from exc


def current_user(token: str | None = Depends(oauth2_scheme)) -> dict:
    return _decode_token(token)


def optional_user(token: str | None = Depends(oauth2_scheme)) -> dict | None:
    return _decode_token(token) if token else None


def require_roles(*roles: str):
    def dependency(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency
