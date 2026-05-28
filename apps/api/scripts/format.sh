#!/bin/bash

source venv/bin/activate
black app
isort app