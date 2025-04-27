import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List

from dotenv import load_dotenv

# --- Import the system prompts ---
from prompts import WARGAME_EVALUATOR_SYSTEM_PROMPT, PROMPT_EXTRACT_MISTAKES_SHORT # Added PROMPT_EXTRACT_MISTAKES_SHORT

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

if not ANTHROPIC_API_KEY:
    print("Warning: ANTHROPIC_API_KEY environment variable not set. /generate endpoint will fail.")
    # raise ValueError("ANTHROPIC_API_KEY environment variable not set.") # Optional: Keep if /generate MUST work

app = FastAPI()

# --- Model for /generate endpoint ---
class GenerateTextInput(BaseModel):
    user_text: str
    # System prompt identifier or custom prompt text.
    # Use "default" for WARGAME_EVALUATOR_SYSTEM_PROMPT,
    # "short" for PROMPT_EXTRACT_MISTAKES_SHORT,
    # or provide a custom prompt string directly.
    # If omitted or null, "default" will be used.
    system_prompt: str | None = None # Default to None, logic will handle it as "default"

# --- Models for /json_to_nl_log endpoint (renamed and updated) ---
class LogEntry(BaseModel):
    timestamp: int
    event_type: str
    details: Dict[str, Any]

class LogInput(BaseModel):
    log_data: List[LogEntry]


# --- Helper Functions for Natural Language Conversion ---

def format_time(seconds: int) -> str:
    """Converts seconds to hh:mm:ss format."""
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}h{m:02d}m{s:02d}s"

asset_lookup: Dict[str, Dict[str, Any]] = {}

def get_asset_name(asset_id: str) -> str:
    """Looks up callsign and type, e.g., 'SATAN 1 (F-22)'."""
    asset = asset_lookup.get(asset_id)
    if asset:
        callsign = asset.get('callsign', 'Unknown Callsign')
        asset_type = asset.get('type', 'Unknown Type')
        return f"{callsign} ({asset_type})"
    if asset_id and "red_" in asset_id:
        return f"Enemy Asset ({asset_id.replace('red_', '')})"
    return asset_id

def calculate_distance_simple_y(pos1_y: float | int, pos2_y: float | int) -> float:
    """Simplified distance calculation based only on Y coordinate for demo."""
    return abs(pos1_y - pos2_y)

# --- /generate endpoint (UPDATED logic for system_prompt) ---
@app.post("/generate")
async def generate_text(text_input: GenerateTextInput):
    """
    Receives user text and a system prompt identifier/text, sends it to the
    Anthropic API, and returns the generated text.
    - system_prompt="default" or null: Uses WARGAME_EVALUATOR_SYSTEM_PROMPT.
    - system_prompt="short": Uses PROMPT_EXTRACT_MISTAKES_SHORT.
    - system_prompt=<other string>: Uses the provided string as a custom prompt.
    (Requires ANTHROPIC_API_KEY)
    """
    if not ANTHROPIC_API_KEY:
         raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured for this endpoint.")

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    # --- NEW: System Prompt Selection Logic ---
    system_prompt_to_use: str | None = None # Initialize
    prompt_input = text_input.system_prompt # Get the value from input

    if prompt_input is None or prompt_input.strip().lower() == "default":
        system_prompt_to_use = WARGAME_EVALUATOR_SYSTEM_PROMPT
        print("Using DEFAULT system prompt.")
    elif prompt_input.strip().lower() == "short":
        system_prompt_to_use = PROMPT_EXTRACT_MISTAKES_SHORT
        print("Using SHORT system prompt.")
    else:
        # Use the provided string directly as a custom prompt
        system_prompt_to_use = prompt_input
        print(f"Using CUSTOM system prompt: '{prompt_input[:50]}...'") # Log truncated prompt
    # --- End of New Logic ---

    messages = [{"role": "user", "content": text_input.user_text}]

    payload = {
        "model": "claude-3-opus-20240229",
        "max_tokens": 2048,
        # "system": system_prompt_to_use, # Will be added conditionally below
        "messages": messages,
    }

    # Conditionally add the system prompt to the payload if one was determined
    if system_prompt_to_use:
         payload["system"] = system_prompt_to_use
    else:
        # Handle case where no system prompt should be used (e.g., if logic determined None)
        # Depending on API requirements, you might need an empty string or omit the key.
        # Anthropic API allows omitting the 'system' key.
        print("No system prompt will be sent to the API.")


    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print(f"Sending payload to Anthropic: {payload}") # Debug: Log payload
            response = await client.post(ANTHROPIC_API_URL, json=payload, headers=headers)
            response.raise_for_status()

        api_response = response.json()
        print(f"Received response from Anthropic: {api_response}") # Debug: Log response

        if api_response.get("content") and len(api_response["content"]) > 0:
             generated_text = api_response["content"][0].get("text", "No text content found.")
        else:
             generated_text = "No content generated or unexpected response structure."

        return JSONResponse(content={"generated_text": generated_text})

    except httpx.HTTPStatusError as exc:
        print(f"HTTP error occurred: {exc}")
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


# --- /json_to_nl_log endpoint (Implementation remains the same) ---
@app.post("/json_to_nl_log")
async def json_to_nl_log(log_input: LogInput):
    """
    Takes detailed JSON log data, processes it into a natural language format
    with potential mistake annotations, and returns the text directly.
    Does NOT call the Anthropic API.
    """
    global asset_lookup # Allow modification of the global lookup
    asset_lookup = {} # Clear lookup for each request
    natural_language_log_lines = []
    log_data = log_input.log_data

    if not log_data:
        raise HTTPException(status_code=400, detail="log_data cannot be empty.")

    # --- State variables for mistake checks ---
    cap_y_coord = None
    pepz_y_coord = None
    last_awacs_detection_range = None
    last_awacs_detection_time = None
    awacs_last_pos = None
    fighter_commit_range = None
    picture_clean_time = None
    f22_target_prio = None # Track if F22s targeted lower prio group
    fighter_elements_cold = {} # Track which fighters went cold prematurely {timestamp: [asset_id]}

    # --- Main Conversion Logic Loop ---
    for entry in log_data:
        log_entry = entry.dict() # Convert Pydantic model to dict for easier access
        timestamp = log_entry["timestamp"]
        time_str = format_time(timestamp)
        event_type = log_entry["event_type"]
        details = log_entry["details"]
        event_description = "Unknown Event" # Default

        try: # Wrap processing in try-except for robustness
            if event_type == "SETUP":
                asset_lookup = {asset['id']: asset for asset in details.get('blue_forces', [])}
                if not asset_lookup:
                     natural_language_log_lines.append(f"TIME: {time_str} WARNING: SETUP event missing blue_forces list.")
                     continue

                blue_desc = ", ".join([get_asset_name(a['id']) for a in details.get('blue_forces', [])])
                objectives = "; ".join(details.get('mission_objectives', ["Not Specified"]))
                event_description = f"Mission Start. Blue Forces: {blue_desc}. Objectives: {objectives}."
                # Initialize AWACS position if present
                for asset in details.get('blue_forces', []):
                    if asset.get('id') == 'awacs_1':
                        awacs_last_pos = asset.get('position') # Store initial position

            elif event_type == "PLAYER_ACTION":
                action = details.get("action_type", "UNKNOWN_ACTION")
                actor_id = details.get("actor_id", "Player") # Assuming player actions might have an actor ID
                target_ids = details.get("target_ids", [])
                targets = [get_asset_name(tid) for tid in target_ids]
                target_str = ", ".join(targets) if targets else "N/A"
                params = details.get("parameters", {})

                if action == "SET_FLIGHT_PATH":
                    dest_type = params.get("destination_type", "Unknown Dest")
                    coords = params.get("coordinates", {})
                    label = params.get("label", dest_type)
                    coord_str = f"[{coords.get('x', '?')},{coords.get('y', '?')}]" if coords else "No Coords"
                    event_description = f"{actor_id} sets {label} for {target_str} to {coord_str}."

                    # Store coords for mistake checks
                    if label == "Fighter CAP" and 'y' in coords:
                        cap_y_coord = coords['y']
                        if pepz_y_coord is not None: # Check if PEPZ already set
                            distance = calculate_distance_simple_y(cap_y_coord, pepz_y_coord)
                            if distance < 90 or distance > 110:
                                event_description += f" *(Mistake: CAP distance to PEPZ is {distance:.0f} NM, TTP is ~100 NM)*"
                    elif label == "Bomber PEPZ" and 'y' in coords:
                        pepz_y_coord = coords['y']
                        if cap_y_coord is not None: # Check if CAP already set
                            distance = calculate_distance_simple_y(cap_y_coord, pepz_y_coord)
                            if distance < 90 or distance > 110:
                                event_description += f" *(Mistake: PEPZ distance to CAP is {distance:.0f} NM, TTP is ~100 NM)*"

                elif action == "SET_POSTURE":
                    posture = params.get("posture", "UNKNOWN")
                    radar = params.get("radar", "UNCHANGED")
                    event_description = f"{actor_id} sets posture for {target_str} to {posture} (Radar: {radar})."
                    # Check for premature cold turn
                    if posture.upper() in ["DEFENSIVE", "COLD"] and radar.upper() == "PASSIVE":
                        # Only flag fighters turning cold
                        is_fighter = any("f22" in tid or "f16" in tid for tid in target_ids) # Example fighter types
                        if is_fighter and (picture_clean_time is None or timestamp < picture_clean_time):
                             fighter_elements_cold[timestamp] = target_ids
                             # Annotation added later when PICTURE_CLEAN occurs

                elif action == "COMMIT":
                    groups = ", ".join(params.get("commit_groups", ["Unknown Groups"]))
                    fighter_commit_range = params.get("commit_range_nm", None)
                    range_str = f" at {fighter_commit_range:.0f} NM" if fighter_commit_range is not None else ""
                    event_description = f"{actor_id} commits MADDOG package ({target_str}) to engage {groups}{range_str}."
                    if fighter_commit_range is not None and fighter_commit_range > 80:
                        event_description += f" *(Mistake: Commit range {fighter_commit_range:.0f} NM > 80 NM TTP)*"


                elif action == "ASSIGN_TARGET":
                    enemy_target = params.get("enemy_group_id", "Unknown Enemy")
                    event_description = f"{actor_id} assigns {target_str} to target {enemy_target}."
                    # Check for F-22 targeting mistake (requires knowledge of group priority)
                    # This check is complex and depends on how group priorities are established/logged.
                    # Simplified Example: Assume red_grp_1 is always highest priority if present during commit.
                    is_f22 = any("f22" in tid for tid in target_ids)
                    if is_f22 and enemy_target != "red_grp_1":
                        # Check if red_grp_1 was part of *any* commit action before this assignment
                        commit_logs = [
                            p for p in log_data
                            if p.get("timestamp", 0) <= timestamp and
                               p.get("event_type") == "PLAYER_ACTION" and
                               p.get("details",{}).get("action_type") == "COMMIT"
                        ]
                        committed_groups = set()
                        for log in commit_logs:
                            committed_groups.update(log.get("details",{}).get("parameters",{}).get("commit_groups",[]))

                        if "red_grp_1" in committed_groups:
                            f22_target_prio = "low" # Flagging potential mistake
                            event_description += f" *(Potential Mistake: F-22 assigned to non-primary group '{enemy_target}' while primary 'red_grp_1' was committed?)*"

                elif action == "RTB":
                    event_description = f"{actor_id} orders {target_str} to Return To Base (RTB)."

                else:
                    event_description = f"{actor_id} action: {action} for {target_str} with params {params}."

            elif event_type == "MOVEMENT":
                 asset_id = details.get("asset_id")
                 new_pos = details.get("new_position")
                 # Log AWACS slide initiation based on movement away from initial spot after threat detected
                 if asset_id == "awacs_1" and awacs_last_pos is not None and new_pos != awacs_last_pos:
                     # Check if this movement constitutes the 'slide'
                     if last_awacs_detection_time is not None and timestamp > last_awacs_detection_time:
                         # Check if it moved significantly away from the initial position
                         # This requires comparing new_pos to the *initial* position, not just the last one.
                         # Let's assume the STATUS_CHANGE event is more reliable for the slide trigger.
                         # event_description = f"{get_asset_name(asset_id)} maneuvering." # Less informative
                         pass # Defer to STATUS_CHANGE for slide logging
                     awacs_last_pos = new_pos # Update last known position

                 # Optionally log other significant movements if needed, otherwise ignore
                 continue # Generally ignore simple movement updates for brevity

            elif event_type == "DETECTION":
                detector = get_asset_name(details.get("detector_id", "Unknown Detector"))
                detected_assets = []
                min_range_nm = float('inf')
                is_awacs_detect = details.get("detector_id") == "awacs_1"

                for group in details.get("detected_groups", []):
                    group_id = group.get("group_id", "Unknown Group")
                    comp = group.get("composition_estimate", ["?x Type?"])[0]
                    range_nm = group.get("range_nm")
                    detected_assets.append(f"{group_id} ({comp}) at {range_nm:.0f} NM" if range_nm is not None else f"{group_id} ({comp})")
                    if range_nm is not None:
                        min_range_nm = min(min_range_nm, range_nm)

                if detected_assets:
                    event_description = f"{detector} detects: {'; '.join(detected_assets)}."
                    # Check for AWACS slide trigger condition
                    if is_awacs_detect and min_range_nm < 150:
                        # Only record the *first* time this happens or if range decreases significantly
                        if last_awacs_detection_time is None or min_range_nm < (last_awacs_detection_range or 150):
                            last_awacs_detection_range = min_range_nm
                            last_awacs_detection_time = timestamp
                            # Check if AWACS hasn't initiated slide yet (using awacs_last_pos as proxy)
                            # A dedicated 'is_sliding' state would be better.
                            # Check if awacs_last_pos is still the initial position (needs initial pos stored)
                            # Simplified: Assume if awacs_last_pos hasn't been updated by a SLIDE event, it hasn't moved.
                            # We need a better state flag for 'is_sliding'. Let's rely on the STATUS_CHANGE event.
                            # Add a note here indicating the condition is met.
                            event_description += f" *(Note: Threat detected < 150NM at {min_range_nm:.0f} NM)*"

                else: # Handle single detection format if needed (less common with groups)
                    detected = get_asset_name(details.get("detected_asset_id", "Unknown Asset"))
                    range_nm = details.get("range_nm")
                    range_str = f" at {range_nm:.0f} NM" if range_nm is not None else ""
                    event_description = f"{detector} detects {detected}{range_str}."
                    if is_awacs_detect and range_nm is not None and range_nm < 150:
                         if last_awacs_detection_time is None or range_nm < (last_awacs_detection_range or 150):
                             last_awacs_detection_range = range_nm
                             last_awacs_detection_time = timestamp
                             event_description += f" *(Note: Threat detected < 150NM at {range_nm:.0f} NM)*"


            elif event_type == "COMBAT":
                action = details.get("action_type", "UNKNOWN_COMBAT")
                if action == "FIRE_MISSILE":
                    shooter = get_asset_name(details.get("shooter_id", "?"))
                    target = get_asset_name(details.get("target_id", "?"))
                    weapon = details.get("weapon_type", "?")
                    range_nm = details.get("range_nm")
                    range_str = f" at {range_nm:.0f} NM" if range_nm is not None else ""
                    event_description = f"{shooter} fires {weapon} at {target}{range_str}."
                elif action == "KILL":
                    victim = get_asset_name(details.get("asset_id", "?"))
                    source = get_asset_name(details.get("source_id", "Unknown"))
                    event_description = f"{victim} destroyed by {source}."
                elif action == "BOMB_RUN":
                    shooter = get_asset_name(details.get("shooter_id", "?"))
                    target = get_asset_name(details.get("target_id", "?"))
                    weapon = details.get("weapon_type", "weapon")
                    result = details.get("result", "UNKNOWN")
                    event_description = f"{shooter} attacks {target} with {weapon}. Result: {result}."
                else:
                    event_description = f"Combat event: {action} involving {details.get('involved_assets', [])}."

            elif event_type == "STATUS_CHANGE":
                asset_id = details.get("asset_id", "?")
                asset = get_asset_name(asset_id)
                status_type = details.get("status_type", "?")
                value = details.get("new_value", "?")

                if status_type == "WAYPOINT_REACHED":
                    event_description = f"{asset} reached waypoint: {value}."
                elif status_type == "HVAA_DEFENSE" and value.upper() == "SLIDE_INITIATED":
                    event_description = f"{asset} initiates SLIDE maneuver."
                    # Check if this slide was timely
                    if asset_id == "awacs_1" and last_awacs_detection_time is not None:
                        delay = timestamp - last_awacs_detection_time
                        if delay > 30: # Example threshold: Slide should happen within 30s
                           event_description += f" *(Mistake: AWACS slide initiated {delay}s after threat detected < 150NM)*"
                        # Mark AWACS as having moved/slid (crude state update)
                        awacs_last_pos = {"status": "sliding"} # Use a status dict instead of coords
                    else:
                         # If slide happens *before* detection < 150NM, it's not necessarily wrong, just early/pre-emptive.
                         pass

                elif status_type == "SENSOR_REPORT" and value == "PICTURE_CLEAN":
                    event_description = f"{asset} reports PICTURE CLEAN."
                    picture_clean_time = timestamp
                    # Check for premature cold turns logged earlier
                    premature_cold_turns = []
                    for cold_time, cold_asset_ids in fighter_elements_cold.items():
                        if cold_time < picture_clean_time:
                            assets_str = ", ".join([get_asset_name(aid) for aid in cold_asset_ids])
                            premature_cold_turns.append(f"{assets_str} at {format_time(cold_time)}")
                    if premature_cold_turns:
                         annotation = f" *(Mistake: Fighters turned cold prematurely before PICTURE CLEAN: {'; '.join(premature_cold_turns)})*"
                         event_description += annotation
                         # Clear the logged cold turns to avoid re-annotating
                         fighter_elements_cold = {t: ids for t, ids in fighter_elements_cold.items() if t >= picture_clean_time}


                elif status_type == "MISSION_PHASE" and value == "MILLER_TIME":
                    event_description = f"{asset} reports MILLER TIME (Targets Destroyed)."
                elif status_type == "FUEL_STATE":
                     event_description = f"{asset} fuel state: {value}." # Example: Log fuel state changes
                elif status_type == "WEAPON_STATE":
                     # Could be very verbose, maybe only log "Winchester" or low states
                     if isinstance(value, dict) and value.get("status") == "Winchester":
                         event_description = f"{asset} reports Winchester {value.get('weapon_type', '')}."
                     else:
                         continue # Ignore detailed weapon counts for now
                else:
                    event_description = f"{asset} status changed: {status_type} = {value}."

            elif event_type == "MISSION_END":
                outcome = details.get("outcome", "Unknown")
                blue_losses = ", ".join([get_asset_name(lid) for lid in details.get("losses_blue", []) if lid]) or "None"
                objectives_met = "; ".join(details.get("objectives_met", [])) or "None"
                objectives_failed = "; ".join(details.get("objectives_failed", [])) or "None"
                event_description = f"Mission End. Outcome: {outcome}. Blue Losses: [{blue_losses}]. Objectives Met: [{objectives_met}]. Objectives Failed: [{objectives_failed}]."
                if "Minimize friendly losses" in details.get("objectives_failed", []):
                     event_description += " *(Note: Tactical Objective Failed - Minimize friendly losses)*"
                # Add check for premature cold turn if picture was never clean
                if picture_clean_time is None and fighter_elements_cold:
                    premature_cold_turns = []
                    for cold_time, cold_asset_ids in fighter_elements_cold.items():
                         assets_str = ", ".join([get_asset_name(aid) for aid in cold_asset_ids])
                         premature_cold_turns.append(f"{assets_str} at {format_time(cold_time)}")
                    if premature_cold_turns:
                        annotation = f" *(Mistake: Fighters turned cold prematurely ({'; '.join(premature_cold_turns)}) and PICTURE CLEAN was never achieved)*"
                        event_description += annotation


            # Append the generated line for this entry
            if event_description != "Unknown Event": # Avoid logging ignored events
                natural_language_log_lines.append(f"TIME: {time_str} {event_description}")

        except Exception as e:
            # Log errors during processing specific entries but continue if possible
            print(f"Error processing log entry at timestamp {timestamp}: {e}")
            import traceback
            traceback.print_exc() # Print full traceback for debugging
            natural_language_log_lines.append(f"TIME: {time_str} ERROR processing event: {event_type} - {e}")


    # Join all lines into a single string
    final_log_string = "\n".join(natural_language_log_lines)

    # Return as JSON containing the text
    return JSONResponse(content={"natural_language_log": final_log_string})


# --- Root endpoint ---
@app.get("/")
async def read_root():
    return {"message": "Wargame Log Processor API"}

# --- Run command reminder ---
# uvicorn main:app --reload