from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import os

DATABASE_URL = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'tasks.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    tasks = relationship("Task", back_populates="owner")
    profile = relationship("Profile", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    gallery_images = relationship("GalleryImage", back_populates="owner", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), default="")
    email = Column(String(100), default="")
    phone = Column(String(50), default="")
    bio = Column(Text, default="")
    avatar = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    owner = relationship("User", back_populates="profile")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "bio": self.bio,
            "avatar": self.avatar,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    owner = relationship("User", back_populates="gallery_images")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "image_data": self.image_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    text = Column(String, nullable=False)
    priority = Column(String(10), nullable=False, default="medium")
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)

    owner = relationship("User", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "priority": self.priority,
            "completed": self.completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "user_id": self.user_id,
        }


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
