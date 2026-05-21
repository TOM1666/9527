from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


class ProfileCreate(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    bio: str = ""
    avatar: str = ""


class ProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    bio: str | None = None
    avatar: str | None = None


class GalleryImageCreate(BaseModel):
    image_data: str


class GalleryImageResponse(BaseModel):
    id: int
    user_id: int
    image_data: str
    created_at: str | None = None

    class Config:
        from_attributes = True
