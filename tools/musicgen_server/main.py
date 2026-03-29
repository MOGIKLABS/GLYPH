import base64
import io

import soundfile as sf
import torch
from audiocraft.models import MusicGen
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class GenerateRequest(BaseModel):
    prompt: str
    title: str | None = None
    durationSec: int = 30
    bpm: int | None = None
    key: str | None = None


model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=30)


@app.post("/generate")
def generate(req: GenerateRequest):
    duration = max(5, min(int(req.durationSec), 120))
    model.set_generation_params(duration=duration)
    wav = model.generate([req.prompt])
    audio = wav[0].detach().cpu().float()
    bio = io.BytesIO()
    sf.write(bio, audio.transpose(0, 1).numpy(), samplerate=model.sample_rate, format="WAV")
    b64 = base64.b64encode(bio.getvalue()).decode("utf-8")
    return {
        "audioBase64": b64,
        "mimeType": "audio/wav",
        "modelName": "facebook/musicgen-small",
        "durationSec": duration,
    }

