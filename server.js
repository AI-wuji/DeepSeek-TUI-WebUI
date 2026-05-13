import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import { Tiktoken } from "js-tiktoken/lite";
import o200kBase from "js-tiktoken/ranks/o200k_base";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ?? Config helpers ????????????????????????????????????????
function parseTomlConfig() {
  const configPath = join(homedir(), ".deepseek", "config.toml");
  if (!existsSync(configPath)) return {};
  const content = readFileSync(configPath, "utf-8");
  const config = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^(\w+)\s*=\s*"([^"]*)"/);
    if (match) config[match[1]] = match[2];
  }
  return config;
}

function getConfig() {
  const conf = parseTomlConfig();
  return {
    apiKey: conf.api_key || process.env.DEEPSEEK_API_KEY || "",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    defaultModel:
      conf.default_text_model || process.env.DEEPSEEK_MODEL || "deepseek-v4-pro",
    temperature: parseFloat(conf.temperature) || 0.7,
    topP: parseFloat(conf.top_p) || 0.9,
    maxTokens: parseInt(conf.max_tokens, 10) || 8192,
    systemPrompt: conf.system_prompt || "",
  };
}

// ?? Available models ??????????????????????????????????????
const AVAILABLE_MODELS = [
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    description: "Standard chat model for general conversation",
    context: 65536,
    vision: false,
    suggested: false,
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    description: "High-performance flagship model with advanced reasoning",
    context: 393216,
    vision: true,
    suggested: true,
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    description: "Fast and efficient model for rapid responses",
    context: 393216,
    vision: false,
    suggested: false,
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder",
    description: "Specialized for code generation and analysis",
    context: 131072,
    vision: false,
    suggested: false,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    description: "Reasoning-focused model for complex problem-solving",
    context: 131072,
    vision: false,
    suggested: false,
  },
];

// ?? Token counter ?????????????????????????????????????????
const tokenEncoder = new Tiktoken(o200kBase);

function countTokens(text) {
  if (!text) return 0;
  try {
    return tokenEncoder.encode(text).length;
  } catch {
    // fallback: rough estimate
    return Math.ceil(text.length / 2);
  }
}

function countSessionTokens(session) {
  let total = 0;
  const msgs = session.messages || [];
  for (const msg of msgs) {
    total += countTokens(msg.content || "");
    if (msg.role === "system") total += 4;
    else if (msg.role === "user") total += 3;
    else if (msg.role === "assistant") total += 3;
  }
  return total;
}

// ?? Data helpers ??????????????????????????????????????????
const DATA_DIR = join(__dirname, "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

function loadSessions() {
  try {
    if (existsSync(SESSIONS_FILE))
      return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8"));
  } catch {
    /* ignore */
  }
  return [];
}

function saveSessions(data) {
  writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

// ?? Express app ???????????????????????????????????????????
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(join(__dirname, "dist")));

// ?? GET /api/config ???????????????????????????????????????
app.get("/api/config", (_req, res) => {
  const cfg = getConfig();
  res.json({
    model: cfg.defaultModel,
    baseUrl: cfg.baseUrl,
    apiKey: !!cfg.apiKey,
    availableModels: AVAILABLE_MODELS,
    settings: {
      temperature: cfg.temperature,
      topP: cfg.topP,
      maxTokens: cfg.maxTokens,
      systemPrompt: cfg.systemPrompt,
    },
  });
});

// ?? GET /api/models ???????????????????????????????????????
app.get("/api/models", (_req, res) => {
  res.json(AVAILABLE_MODELS);
});

// ?? GET /api/health ???????????????????????????????????????
app.get("/api/health", (_req, res) => {
  const cfg = getConfig();
  res.json({ status: "ok", model: cfg.defaultModel });
});

// ?? POST /api/chat/completions ????????????????????????????
app.post("/api/chat/completions", async (req, res) => {
  try {
    const {
      messages,
      model,
      stream = true,
      temperature,
      top_p,
      max_tokens,
      system_prompt,
      api_key,
      base_url,
    } = req.body;

    const cfg = getConfig();
    const apiKey = api_key || cfg.apiKey;
    const baseUrl = base_url || cfg.baseUrl;

    if (!apiKey) {
      return res.status(401).json({ error: "Please configure API Key in settings" });
    }

    // Build request body for upstream API
    const body = {
      model: model || cfg.defaultModel,
      messages: [],
      stream,
    };

    // Inject system prompt if provided
    const sysPrompt = system_prompt || cfg.systemPrompt;
    if (sysPrompt) {
      body.messages.push({ role: "system", content: sysPrompt });
    }

    // Append conversation messages
    for (const m of messages || []) {
      body.messages.push({ role: m.role, content: m.content });
    }

    // Optional parameters
    const temp = temperature != null ? parseFloat(temperature) : cfg.temperature;
    if (temp != null) body.temperature = temp;

    const tp = top_p != null ? parseFloat(top_p) : cfg.topP;
    if (tp != null) body.top_p = tp;

    const mt = max_tokens != null ? parseInt(max_tokens, 10) : cfg.maxTokens;
    if (mt != null) body.max_tokens = mt;

    const upstreamRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      let errText = "";
      try {
        errText = await upstreamRes.text();
      } catch {
        /* ignore */
      }
      console.error(`Upstream API error ${upstreamRes.status}: ${errText}`);
      res.status(upstreamRes.status).send(
        errText || `Upstream API error: ${upstreamRes.status}`
      );
      return;
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        // Connection closed or aborted ? clean exit
        if (e.name !== "AbortError") {
          console.error("Stream read error:", e.message);
        }
      }

      try {
        res.end();
      } catch {
        /* already ended */
      }
    } else {
      const data = await upstreamRes.json();
      res.json(data);
    }
  } catch (err) {
    console.error("Chat completions error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// ?? Session CRUD ??????????????????????????????????????????

app.get("/api/sessions", (_req, res) => {
  res.json(loadSessions());
});

app.post("/api/sessions", (req, res) => {
  const sessions = loadSessions();
  const session = {
    id: randomUUID(),
    title: (req.body.title || "New Chat").slice(0, 100),
    createdAt: new Date().toISOString(),
    messages: [],
  };
  sessions.unshift(session);
  saveSessions(sessions);
  res.json(session);
});

app.patch("/api/sessions/:id", (req, res) => {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (req.body.title != null) session.title = req.body.title.slice(0, 100);
  if (req.body.messages != null) session.messages = req.body.messages;
  saveSessions(sessions);
  res.json(session);
});

app.get("/api/sessions/:id", (req, res) => {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

app.delete("/api/sessions/:id", (req, res) => {
  let sessions = loadSessions();
  sessions = sessions.filter((s) => s.id !== req.params.id);
  saveSessions(sessions);
  res.json({ ok: true });
});

app.post("/api/sessions/:id/messages", (req, res) => {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const { message, messages } = req.body;
  if (messages === null || Array.isArray(messages)) {
    session.messages = messages || [];
  } else if (message) {
    session.messages.push(message);
  }
  saveSessions(sessions);
  res.json({ ok: true });
});

// ?? POST /api/sessions/:id/export ?????????????????????????
app.post("/api/sessions/:id/export", (req, res) => {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const exportData = {
    version: 1,
    type: "deepseek-chat-export",
    exportedAt: new Date().toISOString(),
    session: {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      messages: session.messages,
    },
    metadata: {
      totalMessages: session.messages.length,
      totalTokens: countSessionTokens(session),
    },
  };

  res.json(exportData);
});

// ?? POST /api/import ??????????????????????????????????????
app.post("/api/import", (req, res) => {
  const importData = req.body;

  // Validate import format
  if (!importData || importData.type !== "deepseek-chat-export" || !importData.session) {
    return res.status(400).json({ error: "Invalid import format" });
  }

  const sessions = loadSessions();

  // Check for duplicate by matching message content
  const isDuplicate = sessions.some(
    (s) =>
      s.messages.length === importData.session.messages.length &&
      s.messages.length > 0 &&
      s.messages[0].content === importData.session.messages[0].content
  );

  const newSession = {
    id: randomUUID(),
    title: (importData.session.title || "Imported Chat").slice(0, 100),
    createdAt: new Date().toISOString(),
    messages: importData.session.messages || [],
    imported: true,
    originalId: importData.session.id,
  };

  sessions.unshift(newSession);
  saveSessions(sessions);

  res.json({
    session: newSession,
    isDuplicate,
    metadata: {
      totalMessages: newSession.messages.length,
      totalTokens: countSessionTokens(newSession),
    },
  });
});

// ?? GET /api/sessions/:id/tokens ??????????????????????????
app.get("/api/sessions/:id/tokens", (req, res) => {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const totalTokens = countSessionTokens(session);
  const messages = session.messages || [];
  const messageTokens = messages.map((msg) => ({
    role: msg.role,
    tokens: countTokens(msg.content || ""),
    preview: (msg.content || "").slice(0, 80),
  }));

  res.json({
    sessionId: session.id,
    totalTokens,
    messageCount: messages.length,
    messages: messageTokens,
  });
});

// ?? Serve SPA fallback ????????????????????????????????????

// === Update DeepSeek TUI ===
app.post('/api/update-deepseek', (req, res) => {
  try {
    const result = execSync('npm update -g deepseek-tui 2>&1 || npm install -g deepseek-tui@latest 2>&1', { encoding: 'utf-8', timeout: 120000, cwd: homedir() });
    res.json({ success: true, output: result.trim() });
  } catch (e) {
    res.json({ success: false, error: e.stderr || e.stdout || e.message });
  }
});

app.get("/api/update-deepseek/check", (req, res) => {
  try {
    const currentRaw = execSync("npm list -g deepseek-tui --depth=0 2>&1", { encoding: "utf-8", timeout: 15000 });
    const latestRaw = execSync("npm view deepseek-tui version 2>&1", { encoding: "utf-8", timeout: 15000 });
    const curMatch = currentRaw.match(/(\d+\.\d+\.\d+)/);
    const current = curMatch ? curMatch[1] : currentRaw.trim();
    const latest = latestRaw.trim();
    res.json({ current, latest });
  } catch (e) {
    res.json({ error: e.stderr || e.stdout || e.message });
  }
});
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ?? Start server ??????????????????????????????????????????
const PORT = parseInt(process.env.PORT, 10) || 18080;
app.listen(PORT, () => {
  console.log(`DeepSeek-WebUI started at http://127.0.0.1:${PORT}`);
});