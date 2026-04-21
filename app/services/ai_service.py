import os
import json
from typing import List, Dict, Optional, Union, AsyncGenerator
import httpx
from httpx import Timeout

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/free"

SYSTEM_PROMPT = """You are an expert career counsellor with 20+ years of experience.
Help users with career planning, transitions, interviews, salary negotiation, skill gaps, and professional development.
Be warm, encouraging, and give concrete actionable advice.

Formatting rules for every response:
- Return clean GitHub-flavored markdown only.
- Use short headings like `## Roadmap` or `## Next Steps` when helpful.
- Put each bullet on its own line starting with `- `.
- Put each numbered item on its own line starting with `1. `, `2. `, etc.
- Do not output stray `*`, broken emphasis markers, or separator fragments like `--`.
- Do not put multiple list items on one line.
- Keep formatting simple and consistent."""


def get_openrouter_api_key() -> str:
    return os.getenv("OPENROUTER_API_KEY", "").strip()

def build_system_prompt(profile: Optional[Dict] = None) -> str:
    if not profile:
        return SYSTEM_PROMPT
    ctx = SYSTEM_PROMPT + "\n\n--- USER PROFILE ---"
    if profile.get("name"):             ctx += f"\nName: {profile['name']}"
    if profile.get("current_role"):     ctx += f"\nRole: {profile['current_role']}"
    if profile.get("years_experience"): ctx += f"\nExperience: {profile['years_experience']} years"
    if profile.get("education"):        ctx += f"\nEducation: {profile['education']}"
    if profile.get("skills"):
        skills = profile["skills"]
        if isinstance(skills, list):
            ctx += f"\nSkills: {', '.join(str(skill) for skill in skills[:25])}"
    if profile.get("interests"):
        interests = profile["interests"]
        if isinstance(interests, list):
            ctx += f"\nInterests: {', '.join(str(interest) for interest in interests[:15])}"
    if profile.get("career_goals"):     ctx += f"\nGoals: {profile['career_goals']}"
    if profile.get("location"):         ctx += f"\nLocation: {profile['location']}"
    parsed_resume = profile.get("parsed_resume")
    if isinstance(parsed_resume, dict):
        if parsed_resume.get("summary"):
            ctx += f"\nResume Summary: {parsed_resume['summary']}"
        if parsed_resume.get("current_role") and not profile.get("current_role"):
            ctx += f"\nResume Inferred Role: {parsed_resume['current_role']}"
    ctx += "\n--- END PROFILE ---\nPersonalise your advice based on this profile."
    return ctx

async def get_ai_nonstream(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
) -> str:
    api_key = get_openrouter_api_key()
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Career Counselling AI",
    }

    system = build_system_prompt(profile)
    messages = [{"role": "system", "content": system}]
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.3,
    }

    timeout = Timeout(10.0, read=120.0, write=10.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()

async def get_ai_response(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
    stream: bool = False,
) -> AsyncGenerator[str, None]:
    if stream:
        api_key = get_openrouter_api_key()
        if not api_key:
            yield "Error: OPENROUTER_API_KEY not set."
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Career Counselling AI",
        }

        system = build_system_prompt(profile)
        messages = [{"role": "system", "content": system}]
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        payload = {
            "model": MODEL,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.3,
            "stream": True,
        }

        timeout = Timeout(10.0, read=300.0, write=10.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                async with client.stream("POST", OPENROUTER_URL, json=payload, headers=headers) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            chunk = data.strip()
                            if chunk:
                                try:
                                    delta = json.loads(chunk)["choices"][0]["delta"]["content"] or ""
                                    if delta:
                                        yield delta
                                except (KeyError, json.JSONDecodeError):
                                    pass
            except httpx.TimeoutException:
                yield "\n\nSorry, the AI response timed out. Please try again. It may be due to high load on the free model."
            except Exception as e:
                yield f"\n\nError: Unable to generate response ({str(e)}). Please try again."
    else:
        yield await get_ai_nonstream(conversation_history, profile)

async def get_career_advice_ai(prompt: str) -> str:
    gen = get_ai_response([{"role": "user", "content": prompt}], stream=False)
    async for chunk in gen:
        return chunk
