from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

# auto_error=False so we can handle missing header ourselves (needed for dev bypass)
_bearer = HTTPBearer(auto_error=False)

# Fixed user ID used when SUPABASE_JWT_SECRET is not set (local dev / prototyping)
_DEV_USER_ID = "dev-local-user"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """Return the authenticated user's ID.

    Dev mode: when SUPABASE_JWT_SECRET is not configured, skip verification
    and return a fixed local user ID so the full app works without Supabase.
    """
    if not settings.supabase_jwt_secret:
        return _DEV_USER_ID

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required.",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing subject claim.")
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
