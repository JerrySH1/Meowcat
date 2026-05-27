/// <reference types="@cloudflare/workers-types" />

interface Env {
  HELYCAT_KV: KVNamespace;
  AI: Ai;
}

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

interface ModerationResult {
  allow: boolean;
  categories?: string[];
  reason?: string;
}

const MESSAGE_LIMIT = 300;
const SUBMIT_INTERVAL_MS = 3 * 60 * 1000;
const MAX_MESSAGES = 100;
const MSG_PREFIX = 'msg:';
const RATELIMIT_PREFIX = 'rate:';
const MODERATION_MODEL = '@cf/meta/llama-3.2-3b-instruct';

function countChars(text: string): number {
  let count = 0;
  for (const _ of text) count++;
  return count;
}

function extractJson(content: string): ModerationResult | null {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function moderateText(text: string, ai: Ai): Promise<ModerationResult> {
  const result: any = await ai.run(MODERATION_MODEL, {
    temperature: 0,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content:
          '你是留言审核器。仅输出 JSON：{"allow":boolean,"categories":string[],"reason":string}。若涉及敏感、色情、暴力、血腥、仇恨、恐怖威胁、违法犯罪煽动等不适宜公开内容，allow=false。',
      },
      {
        role: 'user',
        content: `请审核以下留言是否可以公开展示：${text}`,
      },
    ],
  });

  const content = result?.choices?.[0]?.message?.content || result?.response;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`AI response empty. Raw result: ${JSON.stringify(result).substring(0, 500)}`);
  }

  const parsed = extractJson(content);
  if (!parsed || typeof parsed.allow !== 'boolean') {
    throw new Error(`AI JSON parse failed. Content: ${content.substring(0, 200)}`);
  }

  return parsed;
}

async function getMessages(kv: KVNamespace): Promise<Message[]> {
  const list = await kv.list({ prefix: MSG_PREFIX });
  const messages: Message[] = [];
  for (const key of list.keys) {
    const value = await kv.get(key.name);
    if (value) {
      try {
        const parsed: any = JSON.parse(value);
        if (parsed.text && parsed.timestamp) {
          messages.push({
            id: key.name.replace(MSG_PREFIX, ''),
            text: parsed.text,
            timestamp: parsed.timestamp,
          });
        }
      } catch { /* skip corrupt entries */ }
    }
  }
  messages.sort((a, b) => a.timestamp - b.timestamp);
  return messages;
}

async function pruneMessages(kv: KVNamespace): Promise<void> {
  const list = await kv.list({ prefix: MSG_PREFIX });
  if (list.keys.length <= MAX_MESSAGES) return;

  const toDelete = list.keys
    .sort((a, b) => {
      const [aTs] = a.name.replace(MSG_PREFIX, '').split('_');
      const [bTs] = b.name.replace(MSG_PREFIX, '').split('_');
      return parseInt(aTs) - parseInt(bTs);
    })
    .slice(0, list.keys.length - MAX_MESSAGES);

  for (const key of toDelete) {
    await kv.delete(key.name);
  }
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/messages' && request.method === 'GET') {
      try {
        const messages = await getMessages(env.HELYCAT_KV);
        return new Response(JSON.stringify(messages), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    if (path === '/api/messages' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const text: string = body?.text;

        if (!text || typeof text !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid message' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        const normalized = text.trim();
        if (!normalized) {
          return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        if (countChars(normalized) > MESSAGE_LIMIT) {
          return new Response(JSON.stringify({ error: `Message must be within ${MESSAGE_LIMIT} characters` }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rateKey = RATELIMIT_PREFIX + clientIp;
        const existingRate = await env.HELYCAT_KV.get(rateKey);
        if (existingRate) {
          const lastSubmit = parseInt(existingRate);
          const now = Date.now();
          const remainMs = SUBMIT_INTERVAL_MS - (now - lastSubmit);
          if (remainMs > 0) {
            const retryAfterSeconds = Math.ceil(remainMs / 1000);
            return new Response(JSON.stringify({
              error: `Please wait ${retryAfterSeconds} seconds before next message`,
              retryAfterSeconds,
            }), {
              status: 429,
              headers: { ...headers, 'Content-Type': 'application/json' },
            });
          }
        }

        const audit = await moderateText(normalized, env.AI);
        if (!audit.allow) {
          return new Response(JSON.stringify({
            error: 'Message violates content policy and cannot be displayed',
            categories: audit.categories || [],
            reason: audit.reason || '',
          }), {
            status: 422,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        const now = Date.now();
        const id = `${now}_${crypto.randomUUID()}`;
        const newMessage = { text: normalized, timestamp: now };

        await env.HELYCAT_KV.put(MSG_PREFIX + id, JSON.stringify(newMessage));
        await env.HELYCAT_KV.put(rateKey, String(now), { expirationTtl: Math.ceil(SUBMIT_INTERVAL_MS / 1000) });
        await pruneMessages(env.HELYCAT_KV);

        return new Response(JSON.stringify({
          success: true,
          message: { id, ...newMessage },
          nextAllowedAt: now + SUBMIT_INTERVAL_MS,
        }), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        const detail = e?.message || String(e);
        console.error('POST /api/messages error:', detail);
        return new Response(JSON.stringify({ error: `Moderation service unavailable: ${detail}` }), {
          status: 503,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
