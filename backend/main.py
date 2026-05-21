from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from schemas import UserCreate, UserLogin, TokenResponse, UserResponse, ProfileCreate, ProfileUpdate, GalleryImageCreate
import httpx
import os
import glob
from datetime import datetime
from sqlalchemy.orm import Session
from database import get_db, Task, User, Profile, GalleryImage
from auth_routes import router as auth_router
from auth import decode_access_token

app = FastAPI(title="MyDate API")
like_num = 0

MUSIC_DIR = os.path.join(os.path.dirname(__file__), "music")
SUPPORTED_AUDIO_EXTENSIONS = ("*.mp3", "*.wav", "*.ogg", "*.flac", "*.m4a", "*.aac")

class LikeRequest(BaseModel):
    like: int

class TaskCreate(BaseModel):
    text: str
    priority: str = "medium"

class TaskUpdate(BaseModel):
    completed: bool

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载认证路由
app.include_router(auth_router)

# API 路由
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/like")
async def get_like():
    return {"like_num": like_num}

@app.post("/api/like")
async def toggle_like(req: LikeRequest):
    global like_num
    if req.like == 1:
        like_num += 1
        return {"like_num": like_num, "action": "liked"}
    elif req.like == 2:
        like_num = max(0, like_num - 1)
        return {"like_num": like_num, "action": "unliked"}
    else:
        raise HTTPException(status_code=400, detail="Invalid like parameter. Use 1 to like, 2 to unlike.")

@app.get("/api/xc/weather")
async def get_weather():
    url = "https://n34t2cr7um.re.qweatherapi.com/v7/weather/now"
    params = {
        "location": "113.82,34.05",
        "lang": "zh-hans",
        "unit": "m"
    }
    headers = {
        "X-QW-Api-Key": "ac0e95f272924155a2aad5667c1704d7"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Weather API request failed")

@app.get("/api/music/list")
async def list_music():
    if not os.path.exists(MUSIC_DIR):
        return {"tracks": []}
    tracks = []
    for ext in SUPPORTED_AUDIO_EXTENSIONS:
        for filepath in glob.glob(os.path.join(MUSIC_DIR, ext)):
            filename = os.path.basename(filepath)
            name = os.path.splitext(filename)[0]
            tracks.append({"name": name, "filename": filename})
    return {"tracks": tracks}

@app.get("/api/music/stream/{filename}")
async def stream_music(filename: str):
    file_path = os.path.join(MUSIC_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Music file not found")
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail="Invalid file")
    return FileResponse(
        file_path,
        media_type="audio/mpeg" if filename.endswith(".mp3") else "audio/*",
        filename=filename
    )

@app.get("/api/tasks")
async def get_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.created_at.desc()).all()
    return {"tasks": [task.to_dict() for task in tasks]}

@app.get("/api/tasks/history")
async def get_task_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == current_user.id, Task.completed == True).order_by(Task.completed_at.desc()).all()
    return {"tasks": [task.to_dict() for task in tasks]}

@app.post("/api/tasks", status_code=201)
async def create_task(req: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = Task(text=req.text, priority=req.priority, completed=False, user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"task": task.to_dict()}

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: int, req: TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.completed = req.completed
    if req.completed:
        task.completed_at = datetime.now()
    else:
        task.completed_at = None
    db.commit()
    db.refresh(task)
    return {"task": task.to_dict()}

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

@app.get("/api/profile")
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return {"profile": profile.to_dict()}

@app.put("/api/profile")
async def update_profile(req: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
    if req.name is not None:
        profile.name = req.name
    if req.email is not None:
        profile.email = req.email
    if req.phone is not None:
        profile.phone = req.phone
    if req.bio is not None:
        profile.bio = req.bio
    if req.avatar is not None:
        profile.avatar = req.avatar
    profile.updated_at = datetime.now()
    db.commit()
    db.refresh(profile)
    return {"profile": profile.to_dict()}

@app.get("/api/gallery")
async def get_gallery(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    images = db.query(GalleryImage).filter(GalleryImage.user_id == current_user.id).order_by(GalleryImage.created_at.desc()).all()
    return {"images": [img.to_dict() for img in images]}

@app.post("/api/gallery", status_code=201)
async def add_gallery_image(req: GalleryImageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    image = GalleryImage(user_id=current_user.id, image_data=req.image_data)
    db.add(image)
    db.commit()
    db.refresh(image)
    return {"image": image.to_dict()}

@app.delete("/api/gallery/{image_id}")
async def delete_gallery_image(image_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    image = db.query(GalleryImage).filter(GalleryImage.id == image_id, GalleryImage.user_id == current_user.id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}

# 生产环境：提供前端静态文件
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
