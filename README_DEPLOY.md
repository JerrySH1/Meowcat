# Deployment Guide

1. Log into your Baota Panel, go to "Software Store", search for "Node.js version manager" and install it.
2. Open Node.js version manager, install `v20.x` and set it as the command line version.
3. Clean up the project directory to remove the conflicting `node_modules` folder:
   ```bash
   rm -rf node_modules package-lock.json
   ```
4. Install dependencies:
   ```bash
   npm install --registry=https://registry.npmmirror.com
   ```
5. Install `tsx` globally:
   ```bash
   npm install -g tsx --registry=https://registry.npmmirror.com
   ```
6. Create `.env.local` and add your keys (you can do this via the Baota File Manager):
   ```env
   DASHSCOPE_API_KEY=sk-8652d71debe641cfaf3d540038935479
   DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   DASHSCOPE_MODEL_ID=qwen3-32b
   ```
7. In Baota, go to "Website" -> "Node Project" -> "Add Node Project".
   - Project directory: `/www/wwwroot/_dnsauth.meowcat.fun`
   - Project name: `hellycat`
   - Start command: `tsx server.ts` (Custom Command)
   - Port: `3000`
8. Click "Submit" to run the server.
9. Go to the created Node project settings -> "Domain Manager" / "Mapping", map your domain (`meowcat.fun`) to it.
10. Refresh your browser to see the changes.