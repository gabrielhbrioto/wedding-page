#!/bin/bash

set -euo pipefail

source venv/bin/activate
python scripts/check_migration_model_schema.py
pytest