"""
FastAPI HTTP server for humanizer service.
"""

import os
import logging
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from src.pipeline import HumanizationPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Humanizer Service", version="0.1.0")

pipeline = HumanizationPipeline()


class HumanizeResponse(BaseModel):
    """Response model for humanize endpoint."""
    paragraphs_processed: int
    paragraphs_humanized: int
    paragraphs_reverted: int
    errors: list = []


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/humanize", response_class=FileResponse)
async def humanize(file: UploadFile = File(...)):
    """
    Humanize a DOCX document.
    
    Accepts multipart/form-data with a .docx file.
    Returns the humanized .docx file.
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="File must be a .docx file")
    
    # Create temp directory for processing
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, "input.docx")
        output_path = os.path.join(tmpdir, "output.docx")
        
        try:
            # Save uploaded file
            with open(input_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Process through pipeline
            result = pipeline.process(input_path, output_path)
            
            # Return file
            return FileResponse(
                output_path,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename="humanized.docx",
                headers={
                    "X-Paragraphs-Processed": str(result.paragraphs_processed),
                    "X-Paragraphs-Humanized": str(result.paragraphs_humanized),
                    "X-Paragraphs-Reverted": str(result.paragraphs_reverted),
                }
            )
            
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Humanization failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Humanization failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

