import uuid
import json
from datetime import datetime, timezone
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from aiosqlite import Connection

from app.database import get_db
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.ai_service import get_ai_response

router = APIRouter()


def normalize_profile(row) -> dict | None:
    if not row:
        return None

    profile = dict(row)
    for field in ["skills", "interests", "parsed_resume"]:
        value = profile.get(field)
        if isinstance(value, str):
            try:
                profile[field] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return profile

async def stream_generator(history: list[dict[str, str]], profile: dict, payload: ChatRequest, db: Connection, asst_msg_id: str, reply_at: str) -> AsyncGenerator[str, None]:
    full_reply = ""
    async for chunk in get_ai_response(history, profile, stream=True):
        full_reply += chunk
        yield f"data: {chunk}\n\n"
    await db.execute(
        "UPDATE messages SET content = ? WHERE id = ?",
        (full_reply, asst_msg_id),
    )
    await db.execute(
        "UPDATE sessions SET updated_at = ? WHERE id = ?",
        (reply_at, payload.session_id),
    )
    await db.commit()
    yield "data: [DONE]\n\n"

@router.post("/", response_model=ChatResponse)
async def send_message(payload: ChatRequest, stream: bool = Query(False), db: Connection = Depends(get_db)):
    async with db.execute(
        "SELECT id FROM sessions WHERE id = ? AND user_id = ?",
        (payload.session_id, payload.user_id),
    ) as cur:
        session = await cur.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    async with db.execute(
        """SELECT up.*, u.name FROM user_profiles up
           JOIN users u ON u.id = up.user_id
           WHERE up.user_id = ?""",
        (payload.user_id,),
    ) as cur:
        row = await cur.fetchone()
    profile = normalize_profile(row)

    async with db.execute(
        "SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC",
        (payload.session_id,),
    ) as cur:
        rows = await cur.fetchall()
    history = [{"role": r["role"], "content": r["content"]} for r in rows]
    history.append({"role": "user", "content": payload.message})

    user_msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_msg_id, payload.session_id, "user", payload.message, now),
    )
    await db.commit()

    asst_msg_id = str(uuid.uuid4())
    reply_at = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (asst_msg_id, payload.session_id, "assistant", "", reply_at),
    )

    if stream:
        return StreamingResponse(stream_generator(history, profile or {}, payload, db, asst_msg_id, reply_at), media_type="text/plain")
    else:
        try:
            gen = get_ai_response(history, profile)
            reply_text = ""
            async for chunk in gen:
                reply_text += chunk
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
        await db.execute(
            "UPDATE messages SET content = ? WHERE id = ?",
            (reply_text, asst_msg_id),
        )
        await db.commit()
        return ChatResponse(
            session_id=payload.session_id,
            message_id=asst_msg_id,
            reply=reply_text,
            created_at=datetime.fromisoformat(reply_at),
        )
