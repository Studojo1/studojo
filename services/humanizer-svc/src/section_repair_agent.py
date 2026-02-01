"""
LLM-based repair agent for fixing verification failures.
Constrained to preserve original meaning.
"""

import os
import logging
from typing import Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class RepairAgent:
    """LLM-based repair agent for fixing humanized content."""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"
    
    def repair(self, original: str, humanized: str, issue: str) -> Optional[str]:
        """
        Use LLM to repair humanized content while preserving meaning.
        
        Args:
            original: Original paragraph text
            humanized: Humanized paragraph text that failed verification
            issue: Verification failure reason
            
        Returns:
            Repaired text, or None if repair failed
        """
        prompt = f"""You are a text repair assistant. Fix the humanized text to match the original meaning more closely.

Original text: "{original}"

Humanized text (failed verification): "{humanized}"

Issue: {issue}

Requirements:
1. Preserve the exact meaning of the original text
2. Keep the same length (within 20% of original)
3. Use similar vocabulary and structure
4. Do NOT expand, summarize, or add new information
5. Do NOT remove important details

Return ONLY the repaired text, no explanation."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a text repair assistant that fixes humanized text to match original meaning."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500,
            )
            
            repaired = response.choices[0].message.content.strip()
            
            # Remove quotes if present
            if repaired.startswith('"') and repaired.endswith('"'):
                repaired = repaired[1:-1]
            
            return repaired
            
        except Exception as e:
            logger.error(f"Repair agent failed: {e}")
            return None

