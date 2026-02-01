Humanizer Service
=================

Structure-preserving document humanization service using Rephrasy API.

Overview
--------

This service humanizes paragraph content in DOCX documents while preserving:
- Headings
- Tables
- Figures and captions
- References
- Document formatting

Technology
----------

- Python 3.13
- FastAPI
- python-docx
- Rephrasy API
- OpenAI API (for repair agent)

Environment Variables
--------------------

- ``REPHRASY_API_KEY``: Rephrasy API key (required)
- ``OPENAI_API_KEY``: OpenAI API key (required for repair agent)
- ``HUMANIZER_MAX_PARAGRAPHS``: Maximum paragraphs to process (default: 1000)
- ``HUMANIZER_TIMEOUT_SECONDS``: Timeout for processing (default: 300)
- ``PORT``: HTTP server port (default: 8000)

API Endpoints
-------------

- ``GET /health``: Health check
- ``POST /humanize``: Humanize a DOCX file (multipart/form-data)

