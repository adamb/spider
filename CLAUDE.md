# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an early-stage HTTPS proxy project designed to provide secure access to `http://lab.spiderplant.com`. The worker code will be deployed at `https://spider.dev.pr` using Cloudflare Workers.

**Main use case**: Accessing `http://lab.spiderplant.com/tw/open.html?viewname=FDM` via HTTPS with optional caching.

## Current State

The repository is in the initial planning phase with only documentation. No source code, dependencies, or build configuration exists yet.

## Development Setup (To Be Implemented)

This project will likely require:
- **Cloudflare Workers** for deployment at https://spider.dev.pr  
- **wrangler.toml** for Cloudflare Workers configuration
- **package.json** for Node.js dependencies and scripts
- **src/worker.js** or similar for the main proxy logic

## Architecture Notes

The proxy should:
1. Accept HTTPS requests at spider.dev.pr
2. Forward requests to http://lab.spiderplant.com 
3. Return responses over HTTPS
4. Optionally implement caching for performance

## Git Configuration

- **Main branch**: main
- Repository is initialized but contains minimal content