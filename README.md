<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d5ce1c77-b90d-4f86-8b7a-632c1683a940

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create local env file:
   `cp .env.local.example .env.local`
3. Edit `.env.local` and fill your real keys:
   `API_KEY=...`
   `DASHSCOPE_API_KEY=...`
   `DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`
   `DASHSCOPE_MODEL_ID=qwen3-32b`
4. Run the app:
   `npm run dev`

## Message Moderation Rules

The message board now enforces:

1. AI moderation (DashScope/Qwen) for sensitive, pornographic, violent, and unsafe content
2. Max 300 characters per message
3. One submission every 3 minutes per user IP
