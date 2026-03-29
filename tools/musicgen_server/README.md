# MusicGen Local Server

This is an optional local HTTP service that powers `MUSIC_PROVIDER=musicgen-local`.

## Run

1. Create a Python venv
2. Install dependencies from `requirements.txt`
3. Start the server:

`uvicorn main:app --host 127.0.0.1 --port 8000`

## Notes

- This uses `facebook/musicgen-small` from Meta Audiocraft.
- Review model and weight licensing before using in production.

