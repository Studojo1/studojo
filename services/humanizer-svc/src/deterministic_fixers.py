"""
Rule-based fixers for common verification failures.
"""

import logging
from typing import Optional
import re

logger = logging.getLogger(__name__)


class DeterministicFixer:
    """Rule-based fixes for humanized content."""
    
    @staticmethod
    def fix(original: str, humanized: str, issue: str) -> Optional[str]:
        """
        Apply rule-based fixes to humanized text.
        
        Args:
            original: Original paragraph text
            humanized: Humanized paragraph text
            issue: Verification failure reason
            
        Returns:
            Fixed text, or None if fix not applicable
        """
        if "too long" in issue.lower():
            # Truncate to original length
            original_words = original.split()
            humanized_words = humanized.split()
            
            if len(humanized_words) > len(original_words) * 1.5:
                # Take first N words matching original length
                target_length = int(len(original_words) * 1.2)  # Allow 20% expansion
                fixed = " ".join(humanized_words[:target_length])
                logger.info(f"Truncated humanized text from {len(humanized_words)} to {target_length} words")
                return fixed
        
        if "empty" in issue.lower():
            # Return original if humanized is empty
            return original
        
        return None

