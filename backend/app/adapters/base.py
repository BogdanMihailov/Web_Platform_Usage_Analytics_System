from abc import ABC, abstractmethod
from typing import Any, Dict


class Adapter(ABC):
    @abstractmethod
    def fetch(self, url: str) -> Dict[str, Any]:
        raise NotImplementedError()
