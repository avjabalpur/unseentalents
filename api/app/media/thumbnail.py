import logging
import subprocess
from pathlib import Path

from PIL import Image

logger = logging.getLogger(__name__)

THUMBNAIL_SIZE = (480, 480)


def generate_image_thumbnail(source_path: Path, dest_path: Path) -> bool:
    try:
        with Image.open(source_path) as img:
            img = img.convert("RGB")
            img.thumbnail(THUMBNAIL_SIZE)
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            img.save(dest_path, "JPEG", quality=85)
        return True
    except Exception:
        logger.exception("Failed to generate image thumbnail for %s", source_path)
        return False


def generate_video_thumbnail(source_path: Path, dest_path: Path, at_seconds: float = 1.5) -> bool:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-ss", str(at_seconds), "-i", str(source_path),
                "-frames:v", "1", "-vf", "scale=480:-1", str(dest_path),
            ],
            capture_output=True,
            timeout=30,
            check=False,
        )
        if result.returncode != 0:
            logger.warning(
                "ffmpeg thumbnail generation failed for %s: %s",
                source_path,
                result.stderr.decode(errors="ignore"),
            )
            return False
        return dest_path.exists()
    except FileNotFoundError:
        logger.warning("ffmpeg binary not found — skipping video thumbnail generation for %s", source_path)
        return False
    except Exception:
        logger.exception("Unexpected error generating video thumbnail for %s", source_path)
        return False
