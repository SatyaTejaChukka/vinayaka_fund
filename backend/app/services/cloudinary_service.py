from pathlib import Path
from typing import BinaryIO
from uuid import uuid4

from fastapi import HTTPException


UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "events"


def upload_event_photo(file: BinaryIO, filename: str) -> dict[str, str]:
    suffix = Path(filename).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Unsupported image format.")

    stored_name = f"{uuid4().hex}{suffix}"
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    destination = UPLOAD_ROOT / stored_name
    try:
        with destination.open("wb") as output:
            while chunk := file.read(1024 * 1024):
                output.write(chunk)
    except OSError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Unable to save event photo on the server.") from exc

    return {"url": f"/uploads/events/{stored_name}", "public_id": stored_name}


def delete_event_photo(public_id: str | None) -> None:
    if not public_id:
        return
    try:
        path = (UPLOAD_ROOT / public_id).resolve()
        if path.parent == UPLOAD_ROOT.resolve():
            path.unlink(missing_ok=True)
    except OSError:
        pass