"""
Rephrasy API client for humanizing paragraph text.
"""

import os
import logging
import requests
from typing import Optional, Dict, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class RephrasyConfig(BaseModel):
    """Configuration for Rephrasy API."""
    api_key: Optional[str] = None
    base_url: str = "https://v1-humanizer.rephrasy.ai/api"
    timeout: int = 120


class HumanizerError(Exception):
    """Raised when humanization fails."""
    pass


class ParagraphHumanizer:
    """Client for Rephrasy API to humanize paragraph text."""
    
    def __init__(self, config: Optional[RephrasyConfig] = None):
        self.config = config or RephrasyConfig()
        if not self.config.api_key:
            self.config.api_key = os.getenv("REPHRASY_API_KEY")
        
        if not self.config.api_key:
            raise HumanizerError("REPHRASY_API_KEY environment variable not set")
    
    def humanize(self, text: str, order_id: Optional[str] = None) -> str:
        """
        Humanize a paragraph of text using Rephrasy API.
        
        Args:
            text: Original paragraph text
            order_id: Optional order ID for tracking
            
        Returns:
            Humanized text
            
        Raises:
            HumanizerError: If humanization fails
        """
        if not text or not text.strip():
            return text
        
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        
        payload = {
            "text": text,
            "model": "Undetectable Model",
            "words": True,
        }
        
        try:
            response = requests.post(
                self.config.base_url,
                json=payload,
                headers=headers,
                timeout=self.config.timeout,
            )
            response.raise_for_status()
            result = response.json()
            
            output = result.get("output")
            if isinstance(output, str) and output.strip():
                return output
            else:
                logger.warning("Rephrasy returned invalid output, using original text")
                return text
                
        except requests.exceptions.HTTPError as e:
            logger.error(f"Rephrasy API HTTP error: {e.response.status_code if e.response else 'unknown'}")
            raise HumanizerError(f"Rephrasy API error: {e.response.text if e.response else str(e)}") from e
        except requests.exceptions.RequestException as e:
            logger.error(f"Rephrasy API request failed: {e}")
            raise HumanizerError(f"Failed to reach Rephrasy API: {str(e)}") from e

