from abc import ABC, abstractmethod

from fastapi import UploadFile


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, file: UploadFile, key: str) -> str: ...

    @abstractmethod
    def get_url(self, key: str) -> str: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...
