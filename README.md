# **BANE – AI War-Game Debrief System**

**BANE** is an AI-powered war-game debrief and training engine that turns mission and perception data into Weapons School-grade feedback for every Airman—from Airman Leadership School students to operational squadrons and Air Operation Centers.

---

## Table of Contents
1. [Why BANE](#why-bane)
2. [How It Works](#how-it-works)
3. [Demo Walk-through](#demo-walk-through)
4. [Key Features](#key-features)
5. [Roadmap](#roadmap)
6. [Quick Start](#quick-start)
7. [Repository Layout](#repository-layout)
8. [Contributing](#contributing)
9. [License](#license)

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
* **Error #1:** B-1 bombers outrun fighter escort → causal engine flags risk **2 min** before attrition.
* **Error #2:** 4th-gen F-15s (HOSS flight) committed against stealth Red Air instead of 5th-gen assets → Blue losses.
* **Perception Insight:** Eye-tracking shows correct threat detection but delayed commit, isolating decision vs. perception error.

*(Screenshots & video: see [`docs/demo`](docs/demo))*

---

## Key Features
| Capability | Description |
|------------|-------------|
| **Event Extraction** | Parses mission logs into an ordered timeline of tactical events |
| **Causal Inference** | Links actions to outcomes using doctrinal rules and LLM reasoning |
| **Adaptive Scoring** | Grades force packaging, formation geometry, threat awareness, etc. |
| **Eye-Tracking Fusion** | Separates decision errors from perception gaps |
| **Experience-Aware Content** | Adjusts terminology and depth to trainee’s expertise level |
| **Extensible Plug-ins** | Integrate custom sims, sensors, or biometric feeds |

---

## Roadmap
- **RL Curriculum Learning** – Self-play data (à la KataGo) to evolve AI adversaries & coaching agents
- **Deep Causal Graphs** – Multi-layer reasoning across mission, perception, and comms
- **Personalized Mini-Games** – Micro-drills tuned to individual weaknesses
- **Additional Sensors** – Heart-rate, G-force, EEG for cognitive-load analysis

---

## Quick Start
```bash
# Clone & install
 git clone https://github.com/your-org/bane.git
 cd bane
 pip install -r requirements.txt

# Launch local web front-end
 python launch.py   # => http://localhost:8080
```
Then open the browser, drag in a scenario PDF, fly the mission, and drop `mission_log.json` for instant debrief.

---

## Repository Layout
```
├── app/            # Front-end (React/TS)
├── core/           # Event extraction & debrief engine
├── models/         # LLM & RL artifacts
├── docs/           # Demo media & white-papers
└── scripts/        # Utilities
```

---

## Contributing
Issues, PRs, and doctrine nerds welcome! See **[`CONTRIBUTING.md`](CONTRIBUTING.md)**.

---

## License
Apache-2.0 – see **[`LICENSE`](LICENSE)**.

---

> “BANE turns mission & perception data into Weapons School-grade debriefs today—and will fuel reinforcement-learning curricula for even smarter training tomorrow.”
