#!/bin/sh
# Simple script to copy the _redirects file to the dist directory

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy the _redirects file
if [ -f "public/_redirects" ]; then
  cp public/_redirects dist/_redirects
  echo "Successfully copied _redirects file to dist directory"
else
  echo "_redirects file not found in public directory"
  exit 1
fi 