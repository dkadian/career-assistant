import os
import json
from typing import List, Dict, Optional, AsyncGenerator
import httpx
from httpx import Timeout
from openai import AsyncOpenAI
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from accelerate import Accelerator

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "google/gemma-2-9b-it:free"

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "careerboost-exaone")

HF_MODEL = "CareerNinja/t5_large_1e-4_on_V3dataset"

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

# Lazy load HF model
accelerator = Accelerator()
hf_pipeline = None

def get_openrouter_api_key() -> str:
    return os.getenv("OPENROUTER_API_KEY", "").strip()

openai_client = AsyncOpenAI(base_url=LM_STUDIO_URL, api_key="lm-studio") 

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

async def get_lm_studio_nonstream(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
) -> str:
    system = build_system_prompt(profile)
    messages = [{"role": "system", "content": system}]
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    try:
        response = await openai_client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        return content
    except Exception as e:
        print(f"LM STUDIO NON-STREAM REQUEST FAILED: {e}")
        raise

async def get_ai_nonstream(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
    use_lm_studio: bool = False,
) -> str:
    if use_lm_studio:
        try:
            return await get_lm_studio_nonstream(conversation_history, profile)
        except Exception as e:
            print(f"LM STUDIO NON-STREAM FAILED: {e}")
            print(f"LM_STUDIO_URL: {LM_STUDIO_URL}, MODEL: {LM_STUDIO_MODEL}")
            pass
    
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
        "model": OPENROUTER_MODEL,
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
    use_hf: bool = False,
    use_lm_studio: bool = False,
    stream: bool = False,
) -> AsyncGenerator[str, None]:
    if stream:
        # LM Studio stream
        if use_lm_studio:
            try:
                system = build_system_prompt(profile)
                messages = [{"role": "system", "content": system}]
                for msg in conversation_history:
                    messages.append({"role": msg["role"], "content": msg["content"]})
                response = await openai_client.chat.completions.create(
                    model=LM_STUDIO_MODEL,
                    messages=messages,
                    max_tokens=1024,
                    temperature=0.3,
                    stream=True,
                )
                async for chunk in response:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield delta
                return
            except Exception as e:
                print(f"LM Studio stream error: {e}")
        
        # OpenRouter stream fallback
        api_key = get_openrouter_api_key()
        if api_key:
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
                "model": OPENROUTER_MODEL,
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
                                        delta = json.loads(chunk)["choices"][0]["delta"].get("content", "") or ""
                                        if delta:
                                            yield delta
                                    except:
                                        pass
                except:
                    yield "Error generating response."
    else:
        result = await get_ai_nonstream(conversation_history, profile, use_lm_studio)
        yield result

async def get_career_advice_ai(prompt: str, use_lm_studio: bool = False) -> str:
    gen = get_ai_response([{"role": "user", "content": prompt}], stream=False, use_lm_studio=use_lm_studio)
    result = ""
    async for chunk in gen:
        result += chunk
    return result

