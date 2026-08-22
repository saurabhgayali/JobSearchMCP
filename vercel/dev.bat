@echo off
cd /d %~dp0
node node_modules/next/dist/cli/next.js dev -p 3001
