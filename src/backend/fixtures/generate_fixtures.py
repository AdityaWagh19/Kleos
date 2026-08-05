"""
Fixture generator — run ONCE before the demo.
Creates pre-cached LLM responses for all scripted demo beats.

Usage:
    cd src/backend
    python fixtures/generate_fixtures.py

Requires: OPENAI_API_KEY in .env and all services connected.
After running, set DEMO_MODE=true to serve fixtures with zero live API calls.
"""

import os
import sys
import json
import uuid
from pathlib import Path

# Make sure we can import backend modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI
from services.llm_service import compile_document

FIXTURES_DIR = Path(__file__).parent
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def save(name: str, data: dict | str):
    path = FIXTURES_DIR / f"{name}.json" if isinstance(data, dict) else FIXTURES_DIR / name
    if isinstance(data, dict):
        path.write_text(json.dumps(data, indent=2))
    else:
        path.write_text(data)
    print(f"✓ {path.name}")


def gen_drop_pdf_result():
    """Beat 1: Drop PDF → compilation result."""
    result = compile_document(
        "Prism AI is a fictional SaaS startup targeting the Indian B2B market. "
        "The company has high growth (40% MoM) but negative cash flow. "
        "Main competitors: DataBridge, InsightCo, Analytica. "
        "Key assumption: The market is primarily B2B enterprise, not SMB. "
        "Risk: High customer acquisition cost may not be sustainable. "
        "Potential: India's digital transformation is accelerating.",
        workspace_mode="analytical",
    )
    save("compile_document_analytical", result)


def gen_critical_mode():
    """Beat 6: Critical mode switch."""
    result = compile_document(
        "Challenge all existing assumptions about Prism AI's market strategy. "
        "Counter-argue the B2B assumption and the growth metrics.",
        workspace_mode="critical",
    )
    save("compile_document_critical", result)


def gen_memory_card():
    save("memory_card_trigger", {
        "trigger":       True,
        "observation":   "I noticed you optimised for cost over latency twice in this session.",
        "proposed_text": "User consistently prioritises cost over performance trade-offs",
    })


def gen_tier2_demo():
    save("tier2_quarantine_demo", {
        "memory_included": False,
        "explanation":     "The pending memory (quarantined=TRUE) was not included in this response.",
    })


def gen_session_audit():
    save("session_audit", {
        "items": [
            {"memory_id": str(uuid.uuid4()), "text": "You prefer visual over textual outputs",          "confidence": "high"},
            {"memory_id": str(uuid.uuid4()), "text": "This project has a budget constraint of ~$50k",   "confidence": "medium"},
            {"memory_id": str(uuid.uuid4()), "text": "You tend to branch when facing uncertainty",       "confidence": "high"},
        ],
    })


def gen_export_md():
    FIXTURES_DIR.joinpath("export_decision_summary.md").write_text("""\
# Decision Summary
Generated: Demo Session

## Problem Statement
Prism AI product strategy for Indian market (fictional demo)

## Key Assumptions
| Assumption | Confidence | Provenance |
|---|---|---|
| Market is primarily B2B enterprise | medium | parametric |
| Cost optimisation is higher priority than speed | high | voice_input |

## Evidence Used
- [HIGH] Competitor analysis shows DataBridge holds 34% market share (Document)
- [MEDIUM] Indian SMB market growing 60% faster than enterprise (Document)

## Decisions Made
- Committed Branch 2: B2B assumption validated with qualification

## Memory Context
- [GLOBAL] User consistently prioritises cost over performance trade-offs

## Rejected Memories (PS06 Consent Ledger)
- "User prefers async communication" (rejected)
""")
    print("✓ export_decision_summary.md")


if __name__ == "__main__":
    print("Generating demo fixtures (live API calls)...")
    gen_drop_pdf_result()
    gen_critical_mode()
    gen_memory_card()
    gen_tier2_demo()
    gen_session_audit()
    gen_export_md()
    print("\nDone. Set DEMO_MODE=true in .env to use fixtures.")
