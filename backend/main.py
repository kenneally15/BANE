import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable not set.")

app = FastAPI()

# Define the request body model
class TextInput(BaseModel):
    user_text: str
    system_prompt: str | None = "You are a helpful assistant. I will provide you fruit and you will tell me if this is healthy and why: " # Default system prompt

@app.post("/generate")
async def generate_text(text_input: TextInput):
    """
    Receives user text and an optional system prompt, sends it to the Anthropic API,
    and returns the generated text.
    """
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    # Construct the messages payload
    messages = []
    if text_input.system_prompt:
        # Anthropic API expects system prompts outside the messages array
        # Update: As of recent versions, system prompts can be included
        # but let's stick to the documented structure if unsure.
        # The example shows only user/assistant roles in messages.
        # Let's add the system prompt as the first message for now,
        # or use the dedicated 'system' parameter if available/preferred.
        # Using the 'system' parameter is generally recommended now.
        pass # System prompt handled in the main payload below

    messages.append({"role": "user", "content": text_input.user_text})

    payload = {
        "model": "claude-3-7-sonnet-20250219", # Or choose another model like claude-3-sonnet-20240229 or claude-3-haiku-20240307
        "max_tokens": 1024,
        "system": text_input.system_prompt, # Use the dedicated system parameter
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client: # Increased timeout
            response = await client.post(ANTHROPIC_API_URL, json=payload, headers=headers)
            response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        api_response = response.json()

        # Extract the generated text - structure might vary slightly based on model/version
        # Check the actual response structure from Anthropic if this fails
        if api_response.get("content") and len(api_response["content"]) > 0:
             generated_text = api_response["content"][0].get("text", "No text content found.")
        else:
             generated_text = "No content generated or unexpected response structure."

        return JSONResponse(content={"generated_text": generated_text})

    except httpx.HTTPStatusError as exc:
        # Log the error details for debugging
        print(f"HTTP error occurred: {exc}")
        print(f"Response status code: {exc.response.status_code}")
        try:
            print(f"Response content: {exc.response.json()}")
        except Exception:
            print(f"Response content: {exc.response.text}")

        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Error from Anthropic API: {exc.response.text}"
        )
    except httpx.RequestError as exc:
         # Handle network-related errors (e.g., connection timeout)
        print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
        raise HTTPException(status_code=503, detail=f"Service unavailable: {exc}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Add a root endpoint for basic check
@app.get("/")
async def read_root():
    return {"message": "Anthropic API proxy is running."}

# To run the app (save the code as main.py):
# uvicorn main:app --reload