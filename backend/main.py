import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any
from dotenv import load_dotenv

# --- Import the system prompt ---
from prompts import WARGAME_EVALUATOR_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable not set.")

app = FastAPI()

# --- Model for /generate endpoint ---
class TextInput(BaseModel):
    user_text: str
    # Use the imported DEFAULT_SYSTEM_PROMPT as the default
    system_prompt: str | None = WARGAME_EVALUATOR_SYSTEM_PROMPT

# --- Models for /json_to_events endpoint ---
class EventData(BaseModel):
    x: float | int # Allow both int and float
    y: float | int

# Use Dict[str, EventData] for flexible event names (event1, event2, etc.)
class EventInput(BaseModel):
    events: Dict[str, EventData]
    # Optionally allow passing a system prompt through to the generate endpoint
    # Default to None here; the /generate endpoint will handle its own default
    system_prompt: str | None = None

# --- /generate endpoint (existing code) ---
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

    # Use the provided system prompt OR the default from the TextInput model
    # (which now defaults to DEFAULT_SYSTEM_PROMPT from prompts.py)
    system_prompt_to_use = text_input.system_prompt or TextInput.__fields__['system_prompt'].default

    messages = [{"role": "user", "content": text_input.user_text}]

    payload = {
        "model": "claude-3-opus-20240229",
        "max_tokens": 2048, # Increased max_tokens for potentially longer evaluations
        "system": system_prompt_to_use,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client: # Increased timeout
            response = await client.post(ANTHROPIC_API_URL, json=payload, headers=headers)
            response.raise_for_status()

        api_response = response.json()

        if api_response.get("content") and len(api_response["content"]) > 0:
             generated_text = api_response["content"][0].get("text", "No text content found.")
        else:
             generated_text = "No content generated or unexpected response structure."

        return JSONResponse(content={"generated_text": generated_text})

    except httpx.HTTPStatusError as exc:
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
        print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
        raise HTTPException(status_code=503, detail=f"Service unavailable: {exc}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# --- /json_to_events endpoint ---
@app.post("/json_to_events")
async def json_to_events(event_input: EventInput, request: Request):
    """
    Takes JSON event data, calculates differences, formats a string,
    and sends this string to the /generate endpoint using the DEFAULT_SYSTEM_PROMPT
    unless a specific system_prompt is provided in the EventInput.
    """
    difference_lines = []
    # Sort events by key (e.g., event1, event2) for consistent order
    sorted_event_keys = sorted(event_input.events.keys())

    for event_name in sorted_event_keys:
        data = event_input.events[event_name]
        difference = abs(data.x - data.y)
        # Ensure integer differences are represented without .0
        formatted_difference = int(difference) if difference == int(difference) else difference
        difference_lines.append(f"{event_name.capitalize()} is {formatted_difference}") # Capitalize event name

    # Join lines into a single string
    user_text_for_generate = "\n".join(difference_lines)

    # Prepare payload for the internal call to /generate
    # Use the system_prompt passed to this endpoint, OR the default from prompts.py
    system_prompt_to_use = event_input.system_prompt 

    generate_payload = {
        "user_text": user_text_for_generate,
        "system_prompt": system_prompt_to_use
    }

    # Get the base URL of the current request to call the internal endpoint
    base_url = str(request.base_url)
    generate_url = f"{base_url}generate" # Construct the full URL

    try:
        # Make an internal POST request to the /generate endpoint
        async with httpx.AsyncClient(timeout=130.0) as client: # Slightly longer timeout
            response = await client.post(generate_url, json=generate_payload)
            response.raise_for_status() # Check for errors from the /generate call

        # Return the response received from the /generate endpoint
        return JSONResponse(content=response.json())

    except httpx.HTTPStatusError as exc:
        # Error calling the internal /generate endpoint
        print(f"Internal HTTP error calling /generate: {exc}")
        print(f"Response status code: {exc.response.status_code}")
        try:
            print(f"Response content: {exc.response.json()}")
        except Exception:
            print(f"Response content: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Error processing request via /generate: {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Internal request error calling {exc.request.url!r}: {exc}")
        raise HTTPException(status_code=503, detail=f"Service unavailable during internal call: {exc}")
    except Exception as e:
        print(f"An unexpected error occurred in /json_to_events: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# --- Root endpoint (existing code) ---
@app.get("/")
async def read_root():
    return {"message": "Anthropic API proxy is running."}

# --- Run command reminder (existing code) ---
# To run the app (save the code as main.py and prompts.py):
# uvicorn main:app --reload