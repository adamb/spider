# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an early-stage HTTPS proxy project designed to provide secure access to `http://lab.spiderplant.com`. The worker code will be deployed at `https://spider.dev.pr` using Cloudflare Workers.

**Main use case**: Accessing `http://lab.spiderplant.com/tw/open.html?viewname=FDM` via HTTPS with optional caching.

## Current State

The project is fully implemented and deployed. It includes:
- HTTPS proxy functionality with caching
- Device monitoring and alerting system
- API endpoints for devices and probes
- Web interface for viewing probe data

## Deployment

The code is automatically deployed to Cloudflare Workers via GitHub integration:
1. Push changes to the `main` branch on GitHub
2. Cloudflare automatically deploys the updated code to https://spider.dev.pr

No manual deployment steps are required.

## Architecture Notes

The proxy should:
1. Accept HTTPS requests at spider.dev.pr
2. Forward requests to http://lab.spiderplant.com 
3. Return responses over HTTPS
4. Optionally implement caching for performance

### Important Proxy Configuration

**CRITICAL**: The proxy MUST use `redirect: 'manual'` in fetch requests to prevent automatic redirect following. This is essential for:
- `/tw` endpoint functionality (301 redirect from `/tw` to `/tw/`)
- Proper relative path resolution for assets like `pagelib.js`
- Browser receiving correct base URL for subsequent requests

Without `redirect: 'manual'`, the browser never sees redirects and relative paths break, causing 404 errors for JavaScript files and other assets.

## Git Configuration

- **Main branch**: main
- Repository is initialized but contains minimal content