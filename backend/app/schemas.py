"""Pydantic sheme za zahteve in odgovore API-ja."""

from pydantic import BaseModel, ConfigDict, Field

from app.models import UserRole


class UserCreate(BaseModel):
    # 3–30 znakov: crke, stevke, pika, podcrtaj, vezaj (uporabi se v /users/{username})
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9._-]+$")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: UserRole
    profile_public: bool
