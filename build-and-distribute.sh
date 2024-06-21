#!/bin/bash

set -xe

DEST=$1

pnpm build
scp -r ./dist "$DEST"
