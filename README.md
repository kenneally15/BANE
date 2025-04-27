# **BANE – AI War-Game Debrief System**

**BANE** is an AI-powered war game debrief and training system that analyzes mission gameplay and user perception data to deliver personalized, Weapons School-grade feedback for Airmen across all experience levels

---

## Table of Contents
1. [Why BANE](#why-bane)
2. [How It Works](#how-it-works)
3. [Demo Walk-through](#demo-walk-through)
4. [Key Features](#key-features)
5. [Roadmap](#roadmap)
6. [Quick Start](#quick-start)

---

## Why BANE
* Less than **5 %** of the USAF are rated officers; yet every Airman must grasp the "family business" of air-power.
* Great-Power Competition demands rapid, scalable tactical learning across the force.
* Traditional human-only debrief pipelines can’t meet demand—**BANE** scales Weapons School expertise to everyone.

---

## How It Works
| Step | Action |
|------|--------|
| **1  ›** | **Drag & Drop Scenario (PDF)** – Upload mission rules, assets, threats |
| **2  ›** | **Fly / Simulate Mission** – Solo or instructor-led playthrough |
| **3  ›** | **Upload Log (JSON)** – Drop generated gameplay log |
| **4  ›** | **Instant AI Debrief** – Timeline, causal analysis, graded focus points |
| **5  ›** | **Perception Analysis** – Optional eye-tracking stream pinpoints what the trainee saw vs. missed |

---

## Demo Walk-through
* **Scenario:** INDOPACOM strike-package escort versus adversary naval group.
https://drive.google.com/file/d/1SiPJ3YWXkQwKLGsfjZ4HTV-lc09_y5gc/view?usp=sharing

---

## Key Features
| Capability | Description |
|------------|-------------|
| **Event Extraction** | Parses mission logs into an ordered timeline of tactical events |
| **Causal Inference** | Links actions to outcomes using doctrinal rules and LLM reasoning |
| **Eye-Tracking Fusion** | Separates decision errors from perception gaps |

---

## Roadmap
- **RL Curriculum Learning** – Self-play data (à la KataGo) to evolve AI adversaries & coaching agents
- **Deep Causal Graphs** – Multi-layer reasoning across mission, perception, and comms
- **Personalized Mini-Games** – Micro-drills tuned to individual weaknesses
- **Additional Sensors** – Heart-rate, G-force, EEG for cognitive-load analysis

---

## Quick Start
```bash
 python -m venv myenv
 source myenv/bin/activate
 pip install -r backend/requirements.txt
 

# Launch local web front-end
 python launch.py

# Launch back-end
set ANTHROPIC_API_KEY=Your Key
cd backend 
uvicorn main:app --reload
```
Then open the browser, drag in an instructor PDF, fly the mission, and drop `mission_log.json` for instant debrief.

---

> “BANE turns mission & perception data into Weapons School-grade debriefs today—and will fuel reinforcement-learning curricula for even smarter training tomorrow.”
