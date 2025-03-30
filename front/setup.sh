#!/bin/bash

# Rename package.json.new to package.json
mv package.json.new package.json

# Install dependencies
npm install

# Start development server
npm run dev
