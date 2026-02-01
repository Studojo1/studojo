"""
Routes verification failures to appropriate fixers.
"""

from typing import Optional
from .sanity_diff_verifier import VerificationResult


class IssueRouter:
    """Routes verification failures to fixers."""
    
    @staticmethod
    def route(verification_result: VerificationResult) -> str:
        """
        Determine which fixer to use based on verification failure reason.
        
        Args:
            verification_result: Failed VerificationResult
            
        Returns:
            Fixer type: "deterministic" or "repair_agent"
        """
        reason = verification_result.reason or ""
        
        # Use deterministic fixers for simple issues
        if "too long" in reason.lower() or "empty" in reason.lower():
            return "deterministic"
        
        # Use repair agent for semantic issues
        if "similarity" in reason.lower() or "score" in reason.lower():
            return "repair_agent"
        
        # Default to deterministic for unknown issues
        return "deterministic"

