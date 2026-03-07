import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt

PWD_CTX = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
SECRET_KEY = os.environ.get("AUTH_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def hash_password(password: str) -> str:
    return PWD_CTX.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return PWD_CTX.verify(plain, hashed)


def create_access_token(subject: str, token_version: int = 0, role: str = "viewer", expires_delta: Optional[timedelta] = None) -> str:
    now = datetime.utcnow()
    if expires_delta:
        exp = now + expires_delta
    else:
        exp = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": subject,
        "exp": int(exp.timestamp()),
        "ver": int(token_version),
        "role": role,
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
