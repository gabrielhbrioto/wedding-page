#!/bin/bash

source venv/bin/activate
flake8 app
mypy app