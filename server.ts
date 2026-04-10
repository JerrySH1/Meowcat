import express, { Request } from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

const DATA_FILE = path.join(process.cwd(), "messages.json");
const MESSAGE_LIMIT = 300;
const SUBMIT_INTERVAL_MS = 3 * 60 * 1000;
const MAX_MESSAGES = 100;

const API_KEY = process.env.DASHSCOPE_API_KEY;
const BASE_URL = process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const MODEL_ID = process.env.DASHSCOPE_MODEL_ID || "qwen3-32b";

type Message = {
  id: string;
  text: string;
  timestamp: number;
};

type ModerationResult = {
  allow: boolean;
  categories?: string[];
  reason?: string;
};

const submitTracker = new Map<string, number>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || "unknown";
}

function countChars(text: string): number {
  return [...text].length;
}

function extractJson(content: string): ModerationResult | null {
  try {
    return JSON.parse(content);
  } catch (_err) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (_err2) {
      return null;
    }
  }
}

async function moderateWithDashScope(text: string): Promise<ModerationResult> {
  if (!API_KEY) {
    throw new Error("DASHSCOPE_API_KEY is not configured");
  }

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_ID,
      enable_thinking: false,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是留言审核器。仅输出 JSON：{\"allow\":boolean,\"categories\":string[],\"reason\":string}。若涉及敏感、色情、暴力、血腥、仇恨、恐怖威胁、违法犯罪煽动等不适宜公开内容，allow=false。",
        },
        {
          role: "user",
          content: `请审核以下留言是否可以公开展示：${text}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`DashScope API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("DashScope response content is empty");
  }

  const parsed = extractJson(content);
  if (!parsed || typeof parsed.allow !== "boolean") {
    throw new Error("DashScope moderation JSON format invalid");
  }

  return parsed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load messages from file
  let messages: Message[] = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        messages = parsed
          .filter((item) => typeof item?.text === "string" && typeof item?.timestamp === "number")
          .map((item) => ({
            id: typeof item.id === "string" ? item.id : randomUUID(),
            text: item.text,
            timestamp: item.timestamp,
          }));
      }
    }
  } catch (e) {
    console.error("Failed to load messages:", e);
  }

  // Helper to save messages
  const saveMessages = () => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
    } catch (e) {
      console.error("Failed to save messages:", e);
    }
  };

  // API Routes
  app.get("/api/messages", (req, res) => {
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const text = req.body?.text;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Invalid message" });
      return;
    }

    const normalized = text.trim();
    if (!normalized) {
      res.status(400).json({ error: "Message cannot be empty" });
      return;
    }

    if (countChars(normalized) > MESSAGE_LIMIT) {
      res.status(400).json({ error: `Message must be within ${MESSAGE_LIMIT} characters` });
      return;
    }

    const now = Date.now();
    const clientIp = getClientIp(req);
    const lastSubmitAt = submitTracker.get(clientIp) || 0;
    const remainMs = SUBMIT_INTERVAL_MS - (now - lastSubmitAt);
    if (remainMs > 0) {
      const retryAfterSeconds = Math.ceil(remainMs / 1000);
      res.status(429).json({
        error: `Please wait ${retryAfterSeconds} seconds before next message`,
        retryAfterSeconds,
      });
      return;
    }

    moderateWithDashScope(normalized)
      .then((audit) => {
        if (!audit.allow) {
          res.status(422).json({
            error: "Message violates content policy and cannot be displayed",
            categories: audit.categories || [],
            reason: audit.reason || "",
          });
          return;
        }

        const newMessage: Message = {
          id: randomUUID(),
          text: normalized,
          timestamp: now,
        };

        messages.push(newMessage);
        if (messages.length > MAX_MESSAGES) messages = messages.slice(-MAX_MESSAGES);
        submitTracker.set(clientIp, now);
        saveMessages();

        res.json({
          success: true,
          message: newMessage,
          nextAllowedAt: now + SUBMIT_INTERVAL_MS,
        });
      })
      .catch((error) => {
        console.error("Moderation failed:", error);
        res.status(503).json({ error: "Moderation service unavailable, please try again later" });
      });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
