#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "========================================================"
echo "  NOVA LOADER - STANDALONE BACKEND API (FastAPI)"
echo "========================================================"
python3 -m pip install -r requirements.txt --quiet
python3 main.py
