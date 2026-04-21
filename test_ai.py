import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct"

def get_openrouter_api_key() -> str:
    return os.getenv("OPENROUTER_API_KEY", "").strip()

async def test_openrouter():
    api_key = get_openrouter_api_key()
    if not api_key:
        print("Error: OPENROUTER_API_KEY not set in .env")
        return

    print(f"Using API Key: {api_key[:10]}...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": "Hello"}],
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                print("Response:", resp.json()["choices"][0]["message"]["content"])
            else:
                print("Error Response:", resp.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_openrouter())
