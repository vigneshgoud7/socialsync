from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ==========================
# CORS (IMPORTANT for frontend)
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # allow all frontends (HTML, JS)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# CONFIGURATION
# ==========================
SECRET_KEY = "YOUR_SUPER_SECRET_KEY"  # change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

from dotenv import load_dotenv
import os

load_dotenv()  # load .env file

MONGO_URI = os.getenv("MONGO_URI")

print("Mongo URI loaded:", MONGO_URI)


client = AsyncIOMotorClient(MONGO_URI)
db = client["social_sync"]  # database name

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================
# MODELS
# ==========================
class SignupRequest(BaseModel):
    identifier: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# ==========================
# HELPERS
# ==========================
def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==========================
# SIGNUP ROUTE
# ==========================
@app.post("/signup", status_code=201)
async def signup(data: SignupRequest):

    existing = await db.users.find_one({"identifier": data.identifier})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(data.password)

    user_doc = {
        "identifier": data.identifier,
        "password": hashed,
        "created_at": datetime.utcnow()
    }

    await db.users.insert_one(user_doc)

    return {"message": "User created successfully"}


# ==========================
# LOGIN ROUTE
# ==========================
@app.post("/login", response_model=Token)
async def login(data: LoginRequest):

    user = await db.users.find_one({
        "$or": [
            {"identifier": data.identifier},
            {"email": data.identifier},
            {"phone": data.identifier}
        ]
    })

    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = create_access_token({"sub": user["identifier"]})

    return {"access_token": token, "token_type": "bearer"}


# ==========================
# DB TEST ROUTE
# ==========================
@app.get("/test-db")
async def test_db():
    collections = await db.list_collection_names()
    return {"status": "connected", "collections": collections}


# ==========================
# HOME ROUTE
# ==========================
@app.get("/")
def home():
    return {"message": "API is running"}
