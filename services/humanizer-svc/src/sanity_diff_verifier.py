"""
Verifier that checks if humanized content is acceptable.
Ensures no major semantic changes, no expansion, no summarization.
"""

import logging
from typing import Dict, Any, Optional
import difflib

logger = logging.getLogger(__name__)


class VerificationResult:
    """Result of verification check."""
    
    def __init__(self, passed: bool, reason: Optional[str] = None, score: float = 0.0):
        self.passed = passed
        self.reason = reason
        self.score = score  # Similarity score (0-1)


class SanityDiffVerifier:
    """Verifies that humanized content is acceptable."""
    
    def __init__(self, min_similarity: float = 0.7, max_length_ratio: float = 1.5):
        """
        Initialize verifier.
        
        Args:
            min_similarity: Minimum similarity score (0-1) to pass
            max_length_ratio: Maximum allowed length ratio (humanized/original)
        """
        self.min_similarity = min_similarity
        self.max_length_ratio = max_length_ratio
    
    def verify(self, original: str, humanized: str) -> VerificationResult:
        """
        Verify that humanized content is acceptable.
        
        Args:
            original: Original paragraph text
            humanized: Humanized paragraph text
            
        Returns:
            VerificationResult
        """
        if not original.strip():
            return VerificationResult(True, "Empty original text")
        
        if not humanized.strip():
            return VerificationResult(False, "Humanized text is empty")
        
        # Check length ratio (prevent expansion)
        original_len = len(original.split())
        humanized_len = len(humanized.split())
        
        if original_len == 0:
            return VerificationResult(True, "Original has no words")
        
        length_ratio = humanized_len / original_len
        
        if length_ratio > self.max_length_ratio:
            return VerificationResult(
                False,
                f"Humanized text too long (ratio: {length_ratio:.2f})",
                score=0.0
            )
        
        # Calculate similarity using sequence matcher
        similarity = difflib.SequenceMatcher(None, original.lower(), humanized.lower()).ratio()
        
        # Also check word overlap
        original_words = set(original.lower().split())
        humanized_words = set(humanized.lower().split())
        
        if len(original_words) == 0:
            word_overlap = 1.0
        else:
            word_overlap = len(original_words & humanized_words) / len(original_words)
        
        # Combined score (weighted average)
        combined_score = (similarity * 0.6) + (word_overlap * 0.4)
        
        if combined_score < self.min_similarity:
            return VerificationResult(
                False,
                f"Similarity too low (score: {combined_score:.2f})",
                score=combined_score
            )
        
        return VerificationResult(True, "Verification passed", score=combined_score)

