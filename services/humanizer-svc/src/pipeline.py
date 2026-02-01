"""
Main pipeline orchestrator for document humanization.
"""

import os
import logging
import tempfile
from typing import Dict, Tuple
from pathlib import Path

from .document_parser import parse_document, extract_paragraphs
from .structure_extractor import extract_structure, get_paragraphs_to_humanize
from .paragraph_humanizer import ParagraphHumanizer, HumanizerError
from .sanity_diff_verifier import SanityDiffVerifier
from .issue_router import IssueRouter
from .deterministic_fixers import DeterministicFixer
from .section_repair_agent import RepairAgent
from .final_assembler import FinalAssembler

logger = logging.getLogger(__name__)


class HumanizationResult:
    """Result of humanization pipeline."""
    
    def __init__(self):
        self.output_path: str = ""
        self.paragraphs_processed: int = 0
        self.paragraphs_humanized: int = 0
        self.paragraphs_reverted: int = 0
        self.errors: list = []


class HumanizationPipeline:
    """Main pipeline for humanizing documents."""
    
    def __init__(self):
        self.humanizer = ParagraphHumanizer()
        self.verifier = SanityDiffVerifier()
        self.router = IssueRouter()
        self.fixer = DeterministicFixer()
        self.repair_agent = RepairAgent()
        self.assembler = FinalAssembler()
        
        # Configuration
        self.max_paragraphs = int(os.getenv("HUMANIZER_MAX_PARAGRAPHS", "1000"))
        self.timeout_seconds = int(os.getenv("HUMANIZER_TIMEOUT_SECONDS", "300"))
    
    def process(self, input_path: str, output_path: str) -> HumanizationResult:
        """
        Process a document through the humanization pipeline.
        
        Args:
            input_path: Path to input .docx file
            output_path: Path to save output .docx file
            
        Returns:
            HumanizationResult with statistics
        """
        result = HumanizationResult()
        
        try:
            # Step 1: Parse document
            logger.info(f"Parsing document: {input_path}")
            document = parse_document(input_path)
            paragraphs = extract_paragraphs(document)
            
            # Step 2: Extract structure
            logger.info("Extracting document structure")
            structure = extract_structure(document, paragraphs)
            paragraphs_to_humanize = get_paragraphs_to_humanize(structure)
            
            if len(paragraphs_to_humanize) > self.max_paragraphs:
                raise ValueError(f"Document has {len(paragraphs_to_humanize)} paragraphs, exceeds limit of {self.max_paragraphs}")
            
            result.paragraphs_processed = len(paragraphs_to_humanize)
            
            # Step 3: Humanize paragraphs
            logger.info(f"Humanizing {len(paragraphs_to_humanize)} paragraphs")
            humanized_paragraphs: Dict[int, str] = {}
            
            for para_info in paragraphs_to_humanize:
                original_text = para_info.text
                
                try:
                    # Humanize
                    humanized_text = self.humanizer.humanize(original_text)
                    
                    # Verify
                    verification = self.verifier.verify(original_text, humanized_text)
                    
                    if verification.passed:
                        humanized_paragraphs[para_info.index] = humanized_text
                        result.paragraphs_humanized += 1
                        logger.debug(f"Paragraph {para_info.index} humanized and verified")
                    else:
                        # Try to fix
                        logger.warning(f"Paragraph {para_info.index} failed verification: {verification.reason}")
                        fixer_type = self.router.route(verification)
                        
                        fixed_text = None
                        if fixer_type == "deterministic":
                            fixed_text = self.fixer.fix(original_text, humanized_text, verification.reason or "")
                        elif fixer_type == "repair_agent":
                            fixed_text = self.repair_agent.repair(original_text, humanized_text, verification.reason or "")
                        
                        if fixed_text:
                            # Re-verify fixed text
                            re_verification = self.verifier.verify(original_text, fixed_text)
                            if re_verification.passed:
                                humanized_paragraphs[para_info.index] = fixed_text
                                result.paragraphs_humanized += 1
                                logger.info(f"Paragraph {para_info.index} fixed and verified")
                            else:
                                # Revert to original
                                logger.warning(f"Paragraph {para_info.index} fix failed, reverting to original")
                                result.paragraphs_reverted += 1
                        else:
                            # Revert to original
                            logger.warning(f"Paragraph {para_info.index} could not be fixed, reverting to original")
                            result.paragraphs_reverted += 1
                            
                except HumanizerError as e:
                    logger.error(f"Humanization failed for paragraph {para_info.index}: {e}")
                    result.paragraphs_reverted += 1
                    result.errors.append(f"Paragraph {para_info.index}: {str(e)}")
                except Exception as e:
                    logger.error(f"Unexpected error processing paragraph {para_info.index}: {e}")
                    result.paragraphs_reverted += 1
                    result.errors.append(f"Paragraph {para_info.index}: {str(e)}")
            
            # Step 4: Assemble final document
            logger.info("Assembling final document")
            final_doc = self.assembler.assemble(document, structure, humanized_paragraphs)
            
            # Step 5: Save output
            logger.info(f"Saving output to: {output_path}")
            final_doc.save(output_path)
            result.output_path = output_path
            
            logger.info(f"Pipeline completed: {result.paragraphs_humanized} humanized, {result.paragraphs_reverted} reverted")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            result.errors.append(str(e))
            raise
        
        return result

