/*
====================================================
LifeOS Memory Classifier v2
====================================================
*/

const RULES = [
    { type: "mission", patterns: [/\bmy mission\b/i, /\bi am called to\b/i, /\bmy purpose is\b/i] },
    { type: "season", patterns: [/\bin this season\b/i, /\bcurrent season\b/i, /\bright now i am\b/i] },
    { type: "goals", patterns: [/\bmy goal\b/i, /\bi want to\b/i, /\bi plan to\b/i, /\bi need to finish\b/i] },
    { type: "projects", patterns: [/\bproject\b/i, /\bi am building\b/i, /\bi am launching\b/i, /\bworking on\b/i] },
    { type: "strengths", patterns: [/\bmy strength\b/i, /\bi am good at\b/i, /\bpeople rely on me for\b/i] },
    { type: "challenges", patterns: [/\bchallenge\b/i, /\bstruggling\b/i, /\bstuck\b/i, /\boverwhelmed\b/i, /\bdepressed\b/i, /\banxious\b/i] },
    { type: "relationships", patterns: [/\brelationship\b/i, /\bmy wife\b/i, /\bmy husband\b/i, /\bmy family\b/i, /\bmy friend\b/i, /\bmy team\b/i] },
    { type: "identity", patterns: [/\bi am a\b/i, /\bi see myself as\b/i, /\bi believe i am\b/i, /\bi have become\b/i] }
];

export class MemoryClassifier {
    classify(text = "") {
        const clean = String(text).trim();
        if (!clean) return { type: "conversation", value: "", confidence: 0 };

        for (const rule of RULES) {
            if (rule.patterns.some(pattern => pattern.test(clean))) {
                return { type: rule.type, value: clean, confidence: 0.75 };
            }
        }

        return { type: "conversation", value: clean, confidence: 0.25 };
    }
}

export const MemoryType = new MemoryClassifier();
