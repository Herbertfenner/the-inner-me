/*
====================================================
LifeOS Builder Brain v1
====================================================
A durable intelligence layer that turns conversations
into a living Builder record: patterns, commitments,
victories, lessons, timeline events, and growth signals.
*/

const STORAGE_KEY = "lifeos-builder-brain-v1";
const MAX_TIMELINE = 250;
const MAX_EVIDENCE = 20;

const emptyBrain = () => ({
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    messageCount: 0,
    patterns: {},
    commitments: [],
    victories: [],
    lessons: [],
    timeline: []
});

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
    return cleanText(value).toLowerCase();
}

function makeId(prefix = "event") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStorage() {
    try {
        if (typeof localStorage !== "undefined") return localStorage;
    } catch {
        // Browser storage may be unavailable in private or restricted contexts.
    }

    const memory = new Map();
    return {
        getItem: key => memory.has(key) ? memory.get(key) : null,
        setItem: (key, value) => memory.set(key, String(value)),
        removeItem: key => memory.delete(key)
    };
}

export class BuilderBrainEngine {
    constructor(storageKey = STORAGE_KEY, storage = getStorage()) {
        this.storageKey = storageKey;
        this.storage = storage;
        this.state = this.load();
    }

    load() {
        try {
            const saved = JSON.parse(this.storage.getItem(this.storageKey));
            if (!saved || typeof saved !== "object") return emptyBrain();
            return {
                ...emptyBrain(),
                ...saved,
                patterns: saved.patterns && typeof saved.patterns === "object" ? saved.patterns : {},
                commitments: Array.isArray(saved.commitments) ? saved.commitments : [],
                victories: Array.isArray(saved.victories) ? saved.victories : [],
                lessons: Array.isArray(saved.lessons) ? saved.lessons : [],
                timeline: Array.isArray(saved.timeline) ? saved.timeline : []
            };
        } catch {
            return emptyBrain();
        }
    }

    save() {
        this.state.updatedAt = new Date().toISOString();
        this.storage.setItem(this.storageKey, JSON.stringify(this.state));
        return this.snapshot();
    }

    observe({ message, classification, profile } = {}) {
        const text = cleanText(message);
        if (!text) return this.snapshot(profile);

        const type = cleanText(classification?.type || "conversation") || "conversation";
        const value = cleanText(classification?.value || text);
        const timestamp = new Date().toISOString();

        this.state.messageCount += 1;
        this.recordPattern(type, value, text, timestamp);
        this.recordTimeline({
            type: "conversation",
            category: type,
            title: this.timelineTitle(type),
            detail: value,
            source: "conversation-engine",
            createdAt: timestamp
        });

        this.detectMeaningfulEvent(text, type, timestamp);
        return this.saveWithProfile(profile);
    }

    recordPattern(type, value, evidence, timestamp = new Date().toISOString()) {
        if (!type || type === "conversation") return;

        const key = `${type}:${normalizeKey(value)}`;
        const existing = this.state.patterns[key] || {
            key,
            type,
            value,
            count: 0,
            firstSeen: timestamp,
            lastSeen: timestamp,
            evidence: []
        };

        existing.count += 1;
        existing.lastSeen = timestamp;
        if (evidence && !existing.evidence.includes(evidence)) {
            existing.evidence.push(evidence);
            existing.evidence = existing.evidence.slice(-MAX_EVIDENCE);
        }
        this.state.patterns[key] = existing;
    }

    detectMeaningfulEvent(text, type, timestamp) {
        const lower = text.toLowerCase();

        if (/\b(i will|i am going to|i commit|i promise|my next step)\b/.test(lower)) {
            this.addUnique("commitments", text, type, timestamp, "active");
        }

        if (/\b(i did it|i finished|i completed|i overcame|i succeeded|i won|proud of myself)\b/.test(lower)) {
            this.addUnique("victories", text, type, timestamp, "recorded");
        }

        if (/\b(i learned|i realized|i understand now|it taught me|the lesson)\b/.test(lower)) {
            this.addUnique("lessons", text, type, timestamp, "learned");
        }
    }

    addUnique(collectionName, text, category, timestamp, status) {
        const collection = this.state[collectionName];
        const key = normalizeKey(text);
        if (collection.some(item => normalizeKey(item.text) === key)) return;

        const item = {
            id: makeId(collectionName.slice(0, -1)),
            text,
            category,
            status,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        collection.push(item);

        this.recordTimeline({
            type: collectionName.slice(0, -1),
            category,
            title: this.timelineTitle(collectionName.slice(0, -1)),
            detail: text,
            source: "builder-brain",
            createdAt: timestamp
        });
    }

    completeCommitment(id, outcome = "completed") {
        const commitment = this.state.commitments.find(item => item.id === id);
        if (!commitment) return this.snapshot();

        commitment.status = outcome;
        commitment.updatedAt = new Date().toISOString();
        this.recordTimeline({
            type: "commitment-update",
            category: commitment.category,
            title: "Commitment updated",
            detail: `${commitment.text} (${outcome})`,
            source: "builder-brain"
        });
        return this.save();
    }

    recordTimeline(event = {}) {
        const detail = cleanText(event.detail);
        if (!detail) return;

        this.state.timeline.push({
            id: event.id || makeId("timeline"),
            type: cleanText(event.type || "event"),
            category: cleanText(event.category || "general"),
            title: cleanText(event.title || "Builder moment"),
            detail,
            source: cleanText(event.source || "lifeos"),
            createdAt: event.createdAt || new Date().toISOString()
        });
        this.state.timeline = this.state.timeline.slice(-MAX_TIMELINE);
    }

    timelineTitle(type) {
        const titles = {
            goals: "Goal named",
            projects: "Project named",
            mission: "Mission clarified",
            season: "Season identified",
            strengths: "Strength recognized",
            challenges: "Challenge named",
            relationships: "Relationship insight",
            identity: "Identity statement",
            commitment: "Commitment made",
            victory: "Victory recorded",
            lesson: "Lesson learned"
        };
        return titles[type] || "Meaningful conversation";
    }

    getPatterns({ minimumCount = 1, limit = 8 } = {}) {
        return Object.values(this.state.patterns)
            .filter(pattern => pattern.count >= minimumCount)
            .sort((a, b) => b.count - a.count || String(b.lastSeen).localeCompare(String(a.lastSeen)))
            .slice(0, limit)
            .map(clone);
    }

    growthSignals(profile = {}) {
        const activeCommitments = this.state.commitments.filter(item => item.status === "active").length;
        const recurringPatterns = this.getPatterns({ minimumCount: 2, limit: 50 }).length;
        const strengths = Array.isArray(profile.strengths) ? profile.strengths.length : 0;
        const goals = Array.isArray(profile.goals) ? profile.goals.length : 0;
        const projects = Array.isArray(profile.projects) ? profile.projects.length : 0;

        return {
            conversationsObserved: this.state.messageCount,
            activeCommitments,
            victoriesRecorded: this.state.victories.length,
            lessonsRecorded: this.state.lessons.length,
            recurringPatterns,
            strengthsRecognized: strengths,
            activeGoals: goals,
            activeProjects: projects,
            growthScore: Math.min(100, (
                Math.min(this.state.messageCount, 20) * 2 +
                Math.min(this.state.victories.length, 10) * 5 +
                Math.min(this.state.lessons.length, 10) * 3 +
                Math.min(strengths, 10) * 2 +
                Math.min(goals + projects, 10)
            ))
        };
    }

    snapshot(profile = {}) {
        return {
            version: this.state.version,
            createdAt: this.state.createdAt,
            updatedAt: this.state.updatedAt,
            patterns: this.getPatterns(),
            commitments: clone(this.state.commitments.slice(-20)),
            victories: clone(this.state.victories.slice(-20)),
            lessons: clone(this.state.lessons.slice(-20)),
            timeline: clone(this.state.timeline.slice(-30)),
            signals: this.growthSignals(profile)
        };
    }

    saveWithProfile(profile = {}) {
        this.state.updatedAt = new Date().toISOString();
        this.storage.setItem(this.storageKey, JSON.stringify(this.state));
        return this.snapshot(profile);
    }

    clear() {
        this.state = emptyBrain();
        this.storage.removeItem(this.storageKey);
        return this.snapshot();
    }
}

export const BuilderBrain = new BuilderBrainEngine();
