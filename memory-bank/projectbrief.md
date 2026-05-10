# Project Brief

## What it is
A PWA for self-guided tours in a botanic garden. Replaces printed signs and human guides with a digital experience accessible from any smartphone.

## Problem it solves
- The garden has no internet coverage → the app must work offline
- Visitors have no rich information about the plants they're seeing
- Human guides are not always available

## How it works for the visitor
1. Before entering the garden, the visitor opens the app on WiFi → all content downloads
2. They scan QR codes at each station → access info, audio, and photos without internet
3. Alternatively, they can follow the guided walk from the home screen

## Product decisions made
- PWA (not native app) → no app store, works on any phone
- No backend → static JSON content, simpler and zero server cost
- Cloudflare Pages for deploy → free, global CDN, automatic HTTPS
- Content in Spanish (the garden's primary language)
- Warm, natural visual style (brown/cream/sage green palette)

## Project status
- Functional station prototype (Orquídeas) ✓
- Base React/Vite project structure ✓
- Offline PWA configuration ✓
- Two sample stations in JSON ✓
- Pending: real content, garden map, photo gallery, deploy
