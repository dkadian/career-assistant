import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from aiosqlite import Connection

from app.database import get_db
from app.schemas.schemas import UserCreate, UserLogin, UserOut, ProfileUpsert, ProfileOut, UploadFile, File, ResumeUploadResponse
import bcrypt

def get_password_hash(password):
    # Truncate to 72 bytes as per bcrypt specification
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

router = APIRouter()

@router.post("/users", response_model=UserOut)
async def create_user(payload: UserCreate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE email = ?", (payload.email,)) as cur:
        existing = await cur.fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    hashed_password = get_password_hash(payload.password)
    await db.execute("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, payload.name, payload.email, hashed_password, now))
    await db.commit()
    return UserOut(id=user_id, name=payload.name, email=payload.email,
                   created_at=datetime.fromisoformat(now))

@router.post("/login", response_model=UserOut)
async def login(payload: UserLogin, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE email = ?", (payload.email,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    user_data = dict(row)
    if not verify_password(payload.password, user_data.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    return UserOut(**user_data)

@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserOut(**dict(row))

@router.put("/users/{user_id}/profile", response_model=ProfileOut)
async def upsert_profile(user_id: str, payload: ProfileUpsert, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    now = datetime.now(timezone.utc).isoformat()
    skills_json = json.dumps(payload.skills or [])
    interests_json = json.dumps(payload.interests or [])
    await db.execute("""
        INSERT INTO user_profiles (user_id, current_role, years_experience, education,
                                   skills, interests, career_goals, location, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            current_role = excluded.current_role,
            years_experience = excluded.years_experience,
            education = excluded.education,
            skills = excluded.skills,
            interests = excluded.interests,
            career_goals = excluded.career_goals,
            location = excluded.location,
            updated_at = excluded.updated_at
    """, (user_id, payload.current_role, payload.years_experience, payload.education,
            skills_json, interests_json, payload.career_goals, payload.location, now))
    await db.commit()
    return ProfileOut(user_id=user_id, current_role=payload.current_role,
        years_experience=payload.years_experience, education=payload.education,
        skills=payload.skills, interests=payload.interests,
        career_goals=payload.career_goals, location=payload.location,
        updated_at=datetime.fromisoformat(now))

@router.get("/users/{user_id}/profile", response_model=ProfileOut)
async def get_profile(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found.")
    data = dict(row)
    data["skills"] = json.loads(data.get("skills") or "[]")
    data["interests"] = json.loads(data.get("interests") or "[]")
    return ProfileOut(**data)

@router.get("/users/by-email/{email}", response_model=UserOut)
async def get_user_by_email(email: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE email = ?", (email,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserOut(**dict(row))

import fitz  # PyMuPDF
import io
from app.services.resume_parser import parse_resume_from_content
import json
from typing import List

async def extract_text_from_resume(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename.lower()
    if filename.endswith('.pdf'):
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    elif filename.endswith('.docx'):
        try:
            from docx import Document
        except ModuleNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail="DOCX support requires the python-docx package to be installed.",
            ) from exc
        doc = Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or DOCX.")

async def extract_skills_from_resume(user_id: str, resume_text: str, db: Connection):
    prompt = f"""
Extract the top 10 skills from this resume. Respond ONLY with JSON: {{"skills": ["skill1", "skill2"], "interests": ["interest1"]}}

Resume:
{resume_text[:4000]}
"""
    history = [{"role": "user", "content": prompt}]
    full_reply = await get_ai_nonstream(history)
    try:
        parsed = json.loads(full_reply)
        skills = parsed.get("skills", [])
        interests = parsed.get("interests", [])
        # Upsert to profile
        skills_json = json.dumps(skills)
        interests_json = json.dumps(interests)
        now = datetime.now(timezone.utc).isoformat()
        await db.execute("""
            INSERT INTO user_profiles (user_id, skills, interests, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                skills = excluded.skills,
                interests = excluded.interests,
                updated_at = excluded.updated_at
        """, (user_id, skills_json, interests_json, now))
        await db.commit()
        return ResumeUploadResponse(skills=skills, interests=interests, summary="Skills extracted and saved to profile")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/users/{user_id}/resume", response_model=ResumeUploadResponse)
async def upload_resume(user_id: str, file: UploadFile = File(..., description="PDF or DOCX resume"), db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    content = await file.read()
    parsed = await parse_resume_from_content(content, file.filename)
    if 'error' in parsed:
        raise HTTPException(status_code=400, detail=parsed['error'])
    skills = parsed.get('skills', [])
    interests = parsed.get('interests', [])
    summary = parsed.get('summary', 'Resume parsed successfully')
    parsed_json = json.dumps(parsed)
    now = datetime.now(timezone.utc).isoformat()
    skills_json = json.dumps(skills)
    interests_json = json.dumps(interests)
    await db.execute("""
        INSERT INTO user_profiles (user_id, skills, interests, parsed_resume, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            skills = excluded.skills,
            interests = excluded.interests,
            parsed_resume = excluded.parsed_resume,
            updated_at = excluded.updated_at
        """, (user_id, skills_json, interests_json, parsed_json, now))
    await db.commit()
    return ResumeUploadResponse(skills=skills, interests=interests, summary=summary)
