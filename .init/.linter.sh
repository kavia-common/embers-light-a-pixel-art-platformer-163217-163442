#!/bin/bash
cd /home/kavia/workspace/code-generation/embers-light-a-pixel-art-platformer-163217-163442/ember_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

