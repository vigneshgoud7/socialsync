# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel, EmailStr
# from motor.motor_asyncio import AsyncIOMotorClient
# from passlib.context import CryptContext
# from jose import jwt
# from datetime import datetime, timedelta
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
# from dotenv import load_dotenv
# import random
# import os

# # ============================================================
# # FASTAPI APP INITIALIZATION
# # ============================================================
# app = FastAPI()

# # CORS (IMPORTANT)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ============================================================
# # CONFIGURATION
# # ============================================================
# SECRET_KEY = "YOUR_SUPER_SECRET_KEY"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# load_dotenv()
# MONGO_URI = os.getenv("MONGO_URI")
# print("Mongo URI loaded:", MONGO_URI)

# client = AsyncIOMotorClient(MONGO_URI)
# db = client["social_sync"]

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # ============================================================
# # EMAIL CONFIG (GMAIL OTP) — FIXED FOR fastapi-mail 1.5.8
# # ============================================================
# conf = ConnectionConfig(
#     MAIL_USERNAME="vigneshgoud7777@gmail.com",
#     MAIL_PASSWORD="fmnk rdir bglf sesv",
#     MAIL_FROM="vigneshgoud7777@gmail.com",
#     MAIL_PORT=587,
#     MAIL_SERVER="smtp.gmail.com",

#     MAIL_STARTTLS=True,      # NEW required field
#     MAIL_SSL_TLS=False,      # NEW required field

#     USE_CREDENTIALS=True,
#     VALIDATE_CERTS=True
# )

# otp_store = {}  # TEMP STORAGE FOR OTP


# # ============================================================
# # MODELS
# # ============================================================
# class SignupRequest(BaseModel):
#     identifier: str
#     password: str

# class LoginRequest(BaseModel):
#     identifier: str
#     password: str

# class Token(BaseModel):
#     access_token: str
#     token_type: str

# class ForgotPasswordRequest(BaseModel):
#     email: EmailStr

# class VerifyOTPRequest(BaseModel):
#     email: EmailStr
#     otp: int

# class ResetPasswordRequest(BaseModel):
#     email: EmailStr
#     new_password: str


# # ============================================================
# # HELPERS
# # ============================================================
# def hash_password(password):
#     return pwd_context.hash(password)

# def verify_password(plain, hashed):
#     return pwd_context.verify(plain, hashed)

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# # ============================================================
# # SIGNUP
# # ============================================================
# @app.post("/signup", status_code=201)
# async def signup(data: SignupRequest):

#     existing = await db.users.find_one({"identifier": data.identifier})
#     if existing:
#         raise HTTPException(status_code=400, detail="You already have an account. Please login.")

#     hashed = hash_password(data.password)

#     await db.users.insert_one({
#         "identifier": data.identifier,
#         "password": hashed,
#         "created_at": datetime.utcnow()
#     })

#     return {"message": "User created successfully"}


# # ============================================================
# # LOGIN
# # ============================================================
# @app.post("/login", response_model=Token)
# async def login(data: LoginRequest):

#     user = await db.users.find_one({"identifier": data.identifier})

#     if not user:
#         raise HTTPException(status_code=404, detail="Account does not exist")

#     if not verify_password(data.password, user["password"]):
#         raise HTTPException(status_code=401, detail="Incorrect password")

#     token = create_access_token({"sub": user["identifier"]})

#     return {"access_token": token, "token_type": "bearer"}


# # ============================================================
# # SEND OTP — FORGOT PASSWORD
# # ============================================================
# @app.post("/forgot-password")
# async def forgot_password(data: ForgotPasswordRequest):

#     user = await db.users.find_one({"identifier": data.email})
#     if not user:
#         raise HTTPException(status_code=404, detail="Account does not exist")

#     otp = random.randint(100000, 999999)

#     otp_store[data.email] = {
#         "otp": otp,
#         "expires": datetime.utcnow() + timedelta(minutes=5)
#     }

#     message = MessageSchema(
#         subject="Your Password Reset OTP",
#         recipients=[data.email],
#         body=f"Your OTP is: {otp}. It expires in 5 minutes.",
#         subtype="plain"
#     )

#     fm = FastMail(conf)
#     await fm.send_message(message)

#     return {"message": "OTP sent to email"}


# # ============================================================
# # VERIFY OTP
# # ============================================================
# @app.post("/verify-otp")
# async def verify_otp(data: VerifyOTPRequest):

#     if data.email not in otp_store:
#         raise HTTPException(status_code=400, detail="No OTP request found")

#     saved = otp_store[data.email]

#     if datetime.utcnow() > saved["expires"]:
#         raise HTTPException(status_code=400, detail="OTP expired")

#     if data.otp != saved["otp"]:
#         raise HTTPException(status_code=400, detail="Invalid OTP")

#     return {"message": "OTP verified"}


# # ============================================================
# # RESET PASSWORD
# # ============================================================
# @app.post("/reset-password")
# async def reset_password(data: ResetPasswordRequest):

#     user = await db.users.find_one({"identifier": data.email})
#     if not user:
#         raise HTTPException(status_code=404, detail="Account not found")

#     hashed = hash_password(data.new_password)

#     await db.users.update_one(
#         {"identifier": data.email},
#         {"$set": {"password": hashed}}
#     )

#     # Delete OTP after successful reset
#     otp_store.pop(data.email, None)

#     return {"message": "Password updated successfully"}


# # ============================================================
# # BASIC ROUTES
# # ============================================================
# @app.get("/test-db")
# async def test_db():
#     collections = await db.list_collection_names()
#     return {"status": "connected", "collections": collections}

# @app.get("/")
# def home():
#     return {"message": "API is running"}






#new one======================================================//

# main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import random
import os
import aiofiles
import uuid
from typing import List, Optional
#new
from pydantic import BaseModel
from typing import List
from datetime import datetime
# ============================================================
# FASTAPI APP INITIALIZATION
# ============================================================
app = FastAPI()

# CORS (allow your frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# CONFIGURATION
# ============================================================
SECRET_KEY = "YOUR_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("Mongo URI loaded:", MONGO_URI)

client = AsyncIOMotorClient(MONGO_URI)
db = client["social_sync"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Static uploads folder (create if not exists)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
# Serve uploads at /uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ============================================================
# EMAIL CONFIG (fastapi-mail)
# ============================================================
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "you@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "you@example.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

otp_store = {}  # TEMP STORAGE FOR OTP

# ============================================================
# MODELS
# ============================================================
class SignupRequest(BaseModel):
    username: str
    identifier: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: int

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

class MediaItem(BaseModel):
    filename: str
    saved_as: str
    url: str
    content_type: str

class CreatePostRequest(BaseModel):
    caption: str
    description: str
    tags: List[str]
    feeling: str
    location: str
    music: str
    media: List[MediaItem]          # REQUIRED field
    created_at: datetime

# ============================================================
# HELPERS
# ============================================================
def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ============================================================
# AUTH ENDPOINTS (unchanged)
# ============================================================
@app.post("/signup", status_code=201)
async def signup(data: SignupRequest):
    existing = await db.users.find_one({"identifier": data.identifier})
    if existing:
        raise HTTPException(status_code=400, detail="You already have an account. Please login.")
    
    # Check username uniqueness
    existing_user = await db.users.find_one({"username": data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken.")

    hashed = hash_password(data.password)
    await db.users.insert_one({
        "username": data.username,
        "identifier": data.identifier,
        "password": hashed,
        "created_at": datetime.utcnow()
    })
    return {"message": "User created successfully"}

@app.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await db.users.find_one({"identifier": data.identifier})
    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist")
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    token = create_access_token({"sub": user["identifier"], "username": user.get("username", "User")})
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "username": user.get("username", "User")
    }

@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    user = await db.users.find_one({"identifier": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist")
    otp = random.randint(100000, 999999)
    otp_store[data.email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }
    message = MessageSchema(
        subject="Your Password Reset OTP",
        recipients=[data.email],
        body=f"Your OTP is: {otp}. It expires in 5 minutes.",
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "OTP sent to email"}

@app.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest):
    if data.email not in otp_store:
        raise HTTPException(status_code=400, detail="No OTP request found")
    saved = otp_store[data.email]
    if datetime.utcnow() > saved["expires"]:
        raise HTTPException(status_code=400, detail="OTP expired")
    if data.otp != saved["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"message": "OTP verified"}

@app.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    user = await db.users.find_one({"identifier": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    hashed = hash_password(data.new_password)
    await db.users.update_one({"identifier": data.email}, {"$set": {"password": hashed}})
    otp_store.pop(data.email, None)
    return {"message": "Password updated successfully"}

# ============================================================
# BASIC ROUTES
# ============================================================
@app.get("/test-db")
async def test_db():
    collections = await db.list_collection_names()
    return {"status": "connected", "collections": collections}

@app.get("/")
def home():
    return {"message": "API is running"}

# ============================================================
# GET: Fetch all posts for FEED
# ============================================================

@app.get("/posts")
async def get_all_posts():
    """
    Returns all posts sorted by newest first.
    """
    posts_cursor = db.posts.find().sort("created_at", -1)
    posts = []

    async for p in posts_cursor:
        p["_id"] = str(p["_id"])  # convert ObjectId → string
        posts.append(p)

    return posts

# ============================================================
# NEW: Create Post Endpoint
# Accepts multiple files + form fields, saves files locally and inserts metadata into MongoDB.
# ============================================================

@app.post("/create-post")
async def create_post(
    media: List[UploadFile] = File(...),   # REQUIRED
    caption: str = Form(""),
    description: str = Form(""),
    tags: str = Form(""),
    feeling: str = Form(""),
    location: str = Form(""),
    music: str = Form("")
):
    """
    Expected multipart/form-data:
      - media: array of files (images/videos)
      - caption, description, tags, feeling, location, music: form fields
    """

    # MEDIA REQUIRED CHECK
    if not media or len(media) == 0:
        raise HTTPException(status_code=400, detail="At least one media file is required")

    saved_files = []

    try:
        # Save uploaded files
        for up in media:
            ext = os.path.splitext(up.filename)[1] or ""
            unique_name = f"{uuid.uuid4().hex}{ext}"
            dest_path = os.path.join(UPLOAD_DIR, unique_name)

            async with aiofiles.open(dest_path, "wb") as out_file:
                content = await up.read()
                await out_file.write(content)

            file_url = f"/uploads/{unique_name}"
            saved_files.append({
                "filename": up.filename,
                "saved_as": unique_name,
                "url": file_url,
                "content_type": up.content_type
            })

        # Create final document
        post_doc = {
            "caption": caption,
            "description": description,
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
            "feeling": feeling,
            "location": location,
            "music": music,
            "media": saved_files,     # REQUIRED
            "created_at": datetime.utcnow()
        }

        result = await db.posts.insert_one(post_doc)
        post_id = str(result.inserted_id)

        return JSONResponse(status_code=201, content={"message": "Post created", "post_id": post_id})

    except Exception as e:
        # Remove saved files on failure
        for f in saved_files:
            try:
                os.remove(os.path.join(UPLOAD_DIR, f["saved_as"]))
            except:
                pass

        print("Error in create_post:", e)
        raise HTTPException(status_code=500, detail="Internal server error while creating post")


# ============================================================
# GET: Fetch single post by ID
# ============================================================
from bson import ObjectId

@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        post["_id"] = str(post["_id"])
        return post
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Post ID")

# ============================================================
# PUT: Update Post
# ============================================================
@app.put("/posts/{post_id}")
async def update_post(
    post_id: str,
    media: List[UploadFile] = File(None),  # Optional for update
    caption: str = Form(""),
    description: str = Form(""),
    tags: str = Form(""),
    feeling: str = Form(""),
    location: str = Form(""),
    music: str = Form("")
):
    try:
        # Check if post exists
        existing_post = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not existing_post:
            raise HTTPException(status_code=404, detail="Post not found")

        update_data = {
            "caption": caption,
            "description": description,
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
            "feeling": feeling,
            "location": location,
            "music": music,
            "updated_at": datetime.utcnow()
        }

        # Handle Media Update
        # If new media is provided, replace the old ones.
        # If not provided, keep existing.
        if media and len(media) > 0:
            # 1. Delete old files (optional, good for cleanup)
            old_media = existing_post.get("media", [])
            for m in old_media:
                try:
                    os.remove(os.path.join(UPLOAD_DIR, m["saved_as"]))
                except:
                    pass
            
            # 2. Save new files
            saved_files = []
            for up in media:
                ext = os.path.splitext(up.filename)[1] or ""
                unique_name = f"{uuid.uuid4().hex}{ext}"
                dest_path = os.path.join(UPLOAD_DIR, unique_name)

                async with aiofiles.open(dest_path, "wb") as out_file:
                    content = await up.read()
                    await out_file.write(content)

                file_url = f"/uploads/{unique_name}"
                saved_files.append({
                    "filename": up.filename,
                    "saved_as": unique_name,
                    "url": file_url,
                    "content_type": up.content_type
                })
            
            update_data["media"] = saved_files

        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_data}
        )

        return {"message": "Post updated successfully"}

    except Exception as e:
        print("Error updating post:", e)
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================
# INTERACTIONS: LIKES & COMMENTS
# ============================================================

class LikeRequest(BaseModel):
    username: str

class CommentRequest(BaseModel):
    username: str
    text: str

# --- LIKE ENDPOINTS ---

@app.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, req: LikeRequest):
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        current_likes = post.get("likes", [])
        
        if req.username in current_likes:
            # Unlike
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$pull": {"likes": req.username}}
            )
            return {"message": "Unliked", "liked": False}
        else:
            # Like
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$addToSet": {"likes": req.username}}
            )
            return {"message": "Liked", "liked": True}

    except Exception as e:
        print("Error toggling like:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/posts/{post_id}/likes")
async def get_likes(post_id: str):
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        likes = post.get("likes", [])
        # Return list of objects for frontend consistency
        return [{"username": u} for u in likes]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Post ID")

# --- COMMENT ENDPOINTS ---

@app.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, req: CommentRequest):
    try:
        comment = {
            "username": req.username,
            "text": req.text,
            "created_at": datetime.utcnow()
        }
        
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": comment}}
        )
        
        return {"message": "Comment added", "comment": comment}
    except Exception as e:
        print("Error adding comment:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comments = post.get("comments", [])
        return comments
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Post ID")
