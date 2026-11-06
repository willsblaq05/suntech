"""Image ingest for admin-uploaded testimonial photos.

Security invariants:
- Never trust the client-supplied filename or content type; images are
  verified against real content, re-encoded, and stored under random names.
- EXIF/GPS metadata is stripped by the re-encode (phones embed locations).
- Only JPEG, PNG, and WebP sources are accepted; SVG is explicitly refused
  (active content / XSS vector).
- Stored paths are server-relative ("/media/<random>.jpg"); deletion
  validates the path shape before touching the filesystem.
"""

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, status
from PIL import Image

from .config import settings

# Display cap — a 5 MB phone snapshot becomes a ~200 KB web asset.
MAX_SIDE_PIXELS = 1600
JPEG_QUALITY = 85

ACCEPTED_FORMATS = {"JPEG", "PNG", "WEBP"}


def save_image(data: bytes) -> str:
    """Validate, strip metadata, and store one image; returns its /media URL."""
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The image file is empty.",
        )
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image is too large (max {settings.MAX_UPLOAD_MB} MB).",
        )

    try:
        source = Image.open(BytesIO(data))
        source.verify()  # rejects truncated / crafted-but-invalid payloads
        source = Image.open(BytesIO(data))  # verify() consumes the image
        image_format = (source.format or "").upper()
        if image_format == "SVG" or image_format not in ACCEPTED_FORMATS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only JPEG, PNG, or WebP images are supported.",
            )

        # Composite transparency onto white so a transcode to JPEG never
        # renders transparent areas as black.
        if source.mode in ("RGBA", "LA") or (
            source.mode == "P" and "transparency" in source.info
        ):
            background = Image.new("RGB", source.size, (255, 255, 255))
            background.paste(source, mask=source.convert("RGBA").split()[-1])
            image = background
        else:
            image = source.convert("RGB")
        image.thumbnail((MAX_SIDE_PIXELS, MAX_SIDE_PIXELS))
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - any decode failure is a 415
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="That file could not be read as a supported image.",
        ) from exc

    directory = Path(settings.MEDIA_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"testimonial-{uuid4().hex}.jpg"
    image.save(directory / filename, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return f"/media/{filename}"


def delete_image(url_path: str | None) -> None:
    """Best-effort removal of a stored image for its /media URL."""
    if not url_path or not url_path.startswith("/media/"):
        return
    filename = url_path.removeprefix("/media/")
    if "/" in filename or "\\" in filename or ".." in filename:
        return  # unexpected shape — refuse rather than guess
    path = Path(settings.MEDIA_DIR) / filename
    try:
        if path.is_file():
            path.unlink()
    except OSError:
        # Storage issues must not block the DB delete; orphan cleanup is
        # an ops task (see backend/README "Media" section).
        pass
