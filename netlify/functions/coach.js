// Coach Herb — the LifeOS server-side coaching brain.
// This Netlify function is the only place that calls the Anthropic API.

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are Coach Herb, an AI coaching companion created by Dr. Herbert "Coach Herb" Fenner for LifeOS.

You are warm, direct, unhurried, wise, recovery-oriented, strengths-based, and person-centered. You combine leadership coaching, practical life wisdom, faith-aware encouragement, and psychiatric rehabilitation principles without pretending to be a therapist, physician, lawyer, or financial advisor.

Your natural coaching arc is:
1. Hear the feeling with compassion.
2. Reflect the deeper meaning in the person's own situation.
3. Offer one useful insight or reframing.
4. Ask one focused question that grows directly out of the person's last words.

QUESTION STANDARD
- Never ask generic filler such as "What feels most important for me to understand about this right now?"
- Never restart the conversation.
- Ask about the specific fear, choice, relationship, obstacle, moment, or next safe action already present in the person's words.
- Use one question only.
- In safety situations, ask one immediate, practical question that helps the person connect to real human support now.

Use plain language. Keep responses readable on a phone. Build on what the person actually said instead of restarting the conversation.

SAFETY
- Never diagnose or provide medical treatment instructions.
- When depression, overwhelm, or exhaustion appears, respond gently and encourage appropriate human support when useful.
- If the person signals self-harm, suicide, abuse, or immediate danger, stop ordinary coaching and direct them to immediate human help: call or text 988 in the United States, call 911 for immediate danger, or use the local emergency number outside the United States.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: "Coach Herb isn't connected yet — the ANTHROPIC_API_KEY hasn't been set in Netlify." });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Bad request." }); }

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
  "question": "One specific follow-up question tied directly to the person's last words, or null",
  "ready": false,
  "summary": null
}
The reply must be normal prose. Put the follow-up question only in the question field.`;
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(message => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim())
    .slice(-24)
    .map(message => ({ role: message.role, content: message.content.slice(0, 6000) }));

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
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, messages })
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(502, { error: "Coach Herb had trouble responding just now. Please try again in a moment.", detail: detail.slice(0, 300) });
    }

    const data = await response.json();
    const text = (data.content || []).filter(block => block && block.type === "text").map(block => block.text).join("\n").trim();

    if (!structuredMode) return json(200, { reply: text || "I'm here with you — say that once more for me?" });

    const result = parseConversationResult(text);
    result.question = refineQuestion(result.question, messages, result.reply);
    return json(200, result);
  } catch (error) {
    console.error("Coach Herb function error", error);
    return json(502, { error: "Coach Herb couldn't be reached right now. Please try again." });
  }
};

function parseConversationResult(text) {
  let value = text;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (typeof value !== "string") break;
    const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    try { value = JSON.parse(cleaned); continue; }
    catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try { value = JSON.parse(cleaned.slice(start, end + 1)); continue; }
        catch {}
      }
      return { reply: cleaned || "I'm here with you. Tell me a little more about what this has been like.", question: null, ready: false, summary: null };
    }
  }

  if (value && typeof value === "object" && typeof value.reply === "string") {
    const nested = tryParseJson(value.reply);
    if (nested && typeof nested === "object" && typeof nested.reply === "string") value = nested;
  }

  if (!value || typeof value !== "object") {
    return { reply: String(value || "I'm here with you."), question: null, ready: false, summary: null };
  }

  return {
    reply: String(value.reply || value.message || "I'm here with you."),
    question: value.question ? String(value.question) : null,
    ready: Boolean(value.ready),
    summary: value.summary ? String(value.summary) : null
  };
}

function refineQuestion(question, messages, reply) {
  const latest = [...messages].reverse().find(message => message.role === "user")?.content || "";
  const lower = latest.toLowerCase();
  const generic = !question || /what feels most important|what would you like me to understand|tell me more about this|what is most important/i.test(question);
  if (!generic) return question;

  if (/give up living|want to die|kill myself|end my life|suicid|hurt myself|harm myself/.test(lower)) {
    if (/no phone|don't have a phone|cannot call|can't call/.test(lower)) {
      return "Can you get to a nearby person or public place right now—a neighbor, front desk, store, fire station, police station, clinic, or emergency room?";
    }
    if (/don't trust|do not trust|trust anyone/.test(lower)) {
      return "Would you be willing to contact 988 by text while we stay here together?";
    }
    return "Are you in immediate danger of acting on these thoughts right now?";
  }

  if (/depress|heavy|hopeless|exhausted|overwhelmed/.test(lower)) {
    return "When did this heaviness begin feeling different from a bad day?";
  }
  if (/procrastinat|putting off|can't finish|cannot finish|stuck/.test(lower)) {
    return "What usually happens in the moment right before you avoid the project?";
  }
  if (/trust|betray|hurt by|let me down/.test(lower)) {
    return "What happened that taught you it was safer not to trust people?";
  }
  if (/afraid|fear|scared|anxious|worry/.test(lower)) {
    return "What are you afraid will happen if you take the next step?";
  }
  if (/relationship|marriage|husband|wife|partner|family|friend/.test(lower)) {
    return "What do you need from this relationship that you have not been able to say clearly?";
  }
  if (/goal|project|business|build|finish|launch/.test(lower)) {
    return "What is the smallest honest step that would move this forward today?";
  }

  const lastSentence = latest.split(/[.!?]+/).map(value => value.trim()).filter(Boolean).pop();
  if (lastSentence && lastSentence.length < 140) return `What is underneath "${lastSentence}" for you?`;
  return "What happened just before you started feeling this way?";
}

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(cleaned); }
  catch { return null; }
}

function json(statusCode, object) {
  return {
    statusCode,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify(object)
  };
}
