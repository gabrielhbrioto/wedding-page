#!/bin/bash

gnome-terminal -- bash -c "cd apps/api && ./scripts/dev.sh"
gnome-terminal -- bash -c "cd apps/web && npm run dev"