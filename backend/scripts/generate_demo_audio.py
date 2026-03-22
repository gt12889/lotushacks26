"""One-time script to pre-generate demo audio files using ElevenLabs API.

Run from the backend directory:
    python scripts/generate_demo_audio.py

Generates Vietnamese voice summaries for each demo drug and saves them
to static/demo_audio/ for use by the demo mode TTS endpoint.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pathlib import Path
from services.elevenlabs import generate_audio
from config import settings

TEXTS = {
    "summary_metformin": (
        "Metformin 500mg, gia re nhat tai Long Chau, 45 nghin dong, "
        "tiet kiem 90 nghin dong so voi noi dat nhat. "
        "Tim thay 8 san pham tu 5 nha thuoc."
    ),
    "summary_paracetamol": (
        "Paracetamol 500mg, gia re nhat tai Long Chau, 15 nghin dong, "
        "tiet kiem 20 nghin dong. "
        "Tim thay 6 san pham tu 5 nha thuoc."
    ),
    "summary_amoxicillin": (
        "Amoxicillin 500mg, canh bao! Gia tai An Khang thap bat thuong, "
        "8 nghin dong. De nghi mua tai Long Chau, 28 nghin dong. "
        "Phat hien rui ro hang gia."
    ),
}


async def main():
    if not settings.elevenlabs_api_key:
        print("ERROR: ELEVENLABS_API_KEY not set")
        return

    out_dir = Path(__file__).parent.parent / "static" / "demo_audio"
    out_dir.mkdir(parents=True, exist_ok=True)

    for name, text in TEXTS.items():
        out_path = out_dir / f"{name}.mp3"
        if out_path.exists():
            print(f"SKIP: {out_path} already exists")
            continue
        print(f"Generating {name}...")
        audio = await generate_audio(text, settings.elevenlabs_api_key)
        if audio:
            out_path.write_bytes(audio)
            print(f"  OK: {len(audio)} bytes -> {out_path}")
        else:
            print(f"  FAIL: No audio returned for {name}")


if __name__ == "__main__":
    asyncio.run(main())
