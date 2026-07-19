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
- Never ask what is "underneath" a quoted sentence merely because it was the last thing said.
- Ask about the Builder, not about the wording of the Builder's sentence.
- Never restart the conversation.
- Ask about the specific fear, choice, relationship, obstacle, support, future, or next safe action already present in the person's words.
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
  const decision = normalizeDecision(body.pipeline?.decision);
  const specialist = normalizeSpecialist(body.pipeline?.specialist);
  let system = SYSTEM_PROMPT;

  if (typeof body.context === "string" && body.context.trim()) {
    system += "\n\nCURRENT LIFEOS CONTEXT:\n" + body.context.trim().slice(0, 7000);
  }

  if (decision) {
    system += `\n\nHOUSE DECISION — FOLLOW THIS ROUTE
Route: ${decision.route}
Room: ${decision.room}
Objective: ${decision.objective}
Action plan allowed now: ${decision.allowActionPlan ? "yes" : "no"}
Confidence: ${decision.confidence}
Signals: ${decision.signals.join(", ") || "none"}
Instruction: ${decision.instruction}

Do not ignore this route. If action planning is not allowed, keep ready=false and continue the routed conversation. If the route is safety, do not transition to ordinary coaching, Choice, or Action.`;
  }

  if (specialist) {
    system += `\n\nACTIVE COACH HERB SPECIALTY — KEEP ONE VOICE
Mode: ${specialist.label}
Discipline: ${specialist.discipline}
Specialist stance: ${specialist.stance}

You are still Coach Herb. Do not announce a different assistant or persona. Let the expertise change while the relationship and voice remain continuous. Apply this specialty concretely in the response and question.`;
  }

  if (structuredMode) {
    system += `\n\nOUTPUT CONTRACT — NON-NEGOTIABLE
Return one JSON object only. Do not wrap it in markdown and do not place JSON inside another string.
Use exactly these keys:
{
  "reply": "Your compassionate reflection and useful insight. Do not include the follow-up question here.",
  "question": "One specific follow-up question tied directly to the person's life and the active House route, or null",
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
    result.question = refineQuestion(result.question, messages, decision);

    if (decision && !decision.allowActionPlan) {
      result.ready = false;
      result.summary = null;
    }

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

function normalizeDecision(value) {
  if (!value || typeof value !== "object") return null;
  return {
    route: String(value.route || "action"),
    room: String(value.room || "The House"),
    objective: String(value.objective || "Continue toward clarity."),
    allowActionPlan: Boolean(value.allowActionPlan),
    confidence: Number(value.confidence || 0),
    signals: Array.isArray(value.signals) ? value.signals.map(String).slice(0, 8) : [],
    instruction: String(value.instruction || "Continue toward clarity.")
  };
}

function normalizeSpecialist(value) {
  if (!value || typeof value !== "object") return null;
  return {
    label: String(value.label || "Coach Herb"),
    discipline: String(value.discipline || "integrated coaching"),
    stance: String(value.stance || "Stay warm, direct, and focused on the Builder's next useful step.")
  };
}

function refineQuestion(question, messages, decision) {
  const latest = [...messages].reverse().find(message => message.role === "user")?.content || "";
  const lower = latest.toLowerCase();
  const weak = !question || /what feels most important|what would you like me to understand|tell me more about this|what is most important|what is underneath/i.test(question);
  if (!weak) return question;

  if (decision?.route === "safety") {
    if (/no phone|don't have a phone|cannot call|can't call/.test(lower)) {
      return "Can you get to a nearby person or public place right now—a neighbor, front desk, store, fire station, police station, clinic, or emergency room?";
    }
    if (/\bno\b|not really|don't know|unsure/.test(lower)) {
      return "Are you having thoughts of hurting yourself or ending your life right now?";
    }
    return "Are you in immediate danger of acting on these thoughts right now?";
  }

  if (decision?.route === "recovery") {
    return "Have you ever had a period of recovery or sobriety, even briefly, and what helped you during that time?";
  }

  if (decision?.route === "stabilization") {
    return "What is the heaviest part of today, and who could help you carry just that part?";
  }

  if (decision?.route === "grief") {
    return "What do you miss most about the person or life you lost?";
  }

  if (decision?.route === "relationship") {
    return "What do you need from this relationship that you have not been able to say clearly?";
  }

  if (decision?.route === "identity") {
    return "When did you begin believing this struggle was the same thing as who you are?";
  }

  if (decision?.route === "purpose") {
    return "When you picture the life you are fighting for, what do you see yourself building or becoming?";
  }

  if (decision?.route === "leadership") {
    return "What responsibility are you avoiding because the decision may disappoint someone?";
  }

  if (decision?.route === "business") {
    return "Who is the first real customer you can speak with, and what problem would you ask them about?";
  }

  if (/procrastinat|putting off|can't finish|cannot finish|stuck/.test(lower)) {
    return "What usually happens in the moment right before you avoid the project?";
  }
  if (/afraid|fear|scared|anxious|worry/.test(lower)) {
    return "What are you afraid will happen if you take the next step?";
  }
  if (/goal|project|business|build|finish|launch/.test(lower)) {
    return "What is the smallest honest step that would move this forward today?";
  }

  return "What changed today that made you ready to say this out loud?";
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
