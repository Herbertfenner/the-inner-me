// Coach Herb — the LifeOS server-side coaching brain.
// This Netlify function is the only place that calls the Anthropic API.

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are Coach Herb, an AI coaching companion created by Dr. Herbert "Coach Herb" Fenner for LifeOS.

You are warm, direct, unhurried, wise, recovery-oriented, strengths-based, and person-centered. You combine leadership coaching, practical life wisdom, faith-aware encouragement, and psychiatric rehabilitation principles without pretending to be a therapist, physician, lawyer, or financial advisor.

Your natural coaching arc is:
1. Hear the feeling with compassion.
2. Reflect the deeper meaning in the person's own situation.
3. Offer one useful insight or reframing.
4. Ask one focused question that helps the person go deeper or move forward.

Use plain language. Keep responses readable on a phone. Build on what the person actually said instead of restarting the conversation.

SAFETY
- Never diagnose or provide medical treatment instructions.
- When depression, overwhelm, or exhaustion appears, respond gently and encourage appropriate human support when useful.
- If the person signals self-harm, suicide, abuse, or immediate danger, stop ordinary coaching and direct them to immediate human help: call or text 988 in the United States, call 911 for immediate danger, or use the local emergency number outside the United States.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(500, {
      error: "Coach Herb isn't connected yet — the ANTHROPIC_API_KEY hasn't been set in Netlify."
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Bad request." });
  }

  const structuredMode = body.mode === "conversation_engine";
  let system = SYSTEM_PROMPT;

  if (typeof body.context === "string" && body.context.trim()) {
    system += "\n\nCURRENT LIFEOS CONTEXT:\n" + body.context.trim().slice(0, 6000);
  }

  if (structuredMode) {
    system += `\n\nOUTPUT CONTRACT — NON-NEGOTIABLE
Return one JSON object only. Do not wrap it in markdown and do not place JSON inside another string.
Use exactly these keys:
{
  "reply": "Your compassionate reflection and useful insight. Do not include the follow-up question here.",
  "question": "One focused follow-up question, or null",
  "ready": false,
  "summary": null
}
The reply must be normal prose. Put the follow-up question only in the question field.`;
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim()
    )
    .slice(-24)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 6000)
    }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json(400, { error: "No message to respond to." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(502, {
        error: "Coach Herb had trouble responding just now. Please try again in a moment.",
        detail: detail.slice(0, 300)
      });
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((block) => block && block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!structuredMode) {
      return json(200, {
        reply: text || "I'm here with you — say that once more for me?"
      });
    }

    const result = parseConversationResult(text);
    return json(200, result);
  } catch (error) {
    console.error("Coach Herb function error", error);
    return json(502, {
      error: "Coach Herb couldn't be reached right now. Please try again."
    });
  }
};

function parseConversationResult(text) {
  let value = text;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (typeof value !== "string") break;

    const cleaned = value
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      value = JSON.parse(cleaned);
      continue;
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");

      if (start >= 0 && end > start) {
        try {
          value = JSON.parse(cleaned.slice(start, end + 1));
          continue;
        } catch {
          // Fall through to a safe prose response below.
        }
      }

      return {
        reply: cleaned || "I'm here with you. Tell me a little more about what this has been like.",
        question: "What feels most important for me to understand about this right now?",
        ready: false,
        summary: null
      };
    }
  }

  if (value && typeof value === "object" && typeof value.reply === "string") {
    // Some model responses accidentally place another JSON object inside reply.
    const nested = tryParseJson(value.reply);
    if (nested && typeof nested === "object" && typeof nested.reply === "string") {
      value = nested;
    }
  }

  if (!value || typeof value !== "object") {
    return {
      reply: String(value || "I'm here with you."),
      question: "What feels most important for me to understand about this right now?",
      ready: false,
      summary: null
    };
  }

  return {
    reply: String(value.reply || value.message || "I'm here with you."),
    question: value.question ? String(value.question) : null,
    ready: Boolean(value.ready),
    summary: value.summary ? String(value.summary) : null
  };
}

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function json(statusCode, object) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    },
    body: JSON.stringify(object)
  };
}
