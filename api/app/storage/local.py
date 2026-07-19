from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings
from app.storage.base import StorageBackend

settings = get_settings()

_CHUNK_SIZE = 1024 * 1024


class LocalStorageBackend(StorageBackend):
    def __init__(self, root: Path | None = None):
        self.root = root or settings.storage_root
        self.root.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, key: str) -> str:
        destination = self.root / key
        destination.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(destination, "wb") as out:
            while chunk := await file.read(_CHUNK_SIZE):
                await out.write(chunk)
        return key

    def save_bytes(self, data: bytes, key: str) -> str:
        destination = self.root / key
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        return key

    def get_url(self, key: str) -> str:
        return f"/media/{key}"

    def get_path(self, key: str) -> Path:
        return self.root / key

    def delete(self, key: str) -> None:
        path = self.root / key
        if path.exists():
            path.unlink()


_backend: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    global _backend
    if _backend is None:
        if settings.storage_backend == "local":
            _backend = LocalStorageBackend()
        else:
            raise NotImplementedError(f"Storage backend '{settings.storage_backend}' is not implemented yet.")
    return _backend
