from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import random
import os

# ============================================================
# FASTAPI APP INITIALIZATION
# ============================================================
app = FastAPI()

# CORS (IMPORTANT)
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

# ============================================================
# EMAIL CONFIG (GMAIL OTP) — FIXED FOR fastapi-mail 1.5.8
# ============================================================
conf = ConnectionConfig(
    MAIL_USERNAME="vigneshgoud7777@gmail.com",
    MAIL_PASSWORD="fmnk rdir bglf sesv",
    MAIL_FROM="vigneshgoud7777@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",

    MAIL_STARTTLS=True,      # NEW required field
    MAIL_SSL_TLS=False,      # NEW required field

    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

otp_store = {}  # TEMP STORAGE FOR OTP


# ============================================================
# MODELS
# ============================================================
class SignupRequest(BaseModel):
    identifier: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

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
# SIGNUP
# ============================================================
@app.post("/signup", status_code=201)
async def signup(data: SignupRequest):

    existing = await db.users.find_one({"identifier": data.identifier})
    if existing:
        raise HTTPException(status_code=400, detail="You already have an account. Please login.")

    hashed = hash_password(data.password)

    await db.users.insert_one({
        "identifier": data.identifier,
        "password": hashed,
        "created_at": datetime.utcnow()
    })

    return {"message": "User created successfully"}


# ============================================================
# LOGIN
# ============================================================
@app.post("/login", response_model=Token)
async def login(data: LoginRequest):

    user = await db.users.find_one({"identifier": data.identifier})

    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_access_token({"sub": user["identifier"]})

    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# SEND OTP — FORGOT PASSWORD
# ============================================================
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


# ============================================================
# VERIFY OTP
# ============================================================
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


# ============================================================
# RESET PASSWORD
# ============================================================
@app.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):

    user = await db.users.find_one({"identifier": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    hashed = hash_password(data.new_password)

    await db.users.update_one(
        {"identifier": data.email},
        {"$set": {"password": hashed}}
    )

    # Delete OTP after successful reset
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
