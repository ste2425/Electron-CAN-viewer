#!/bin/bash

STR=$(printenv GH_TOKEN)

GH_TOKEN=$STR && npm run publish

# Electron builder uses ENV variables to find the github access token.
# For some reason my machine went squiffy and Node found an old version no matter what i do.
# This script simply loads the correct version and gives it to node.