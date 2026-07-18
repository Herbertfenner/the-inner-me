/*
====================================================
LifeOS Memory Classifier v1
====================================================
*/

export class MemoryClassifier {

    classify(text) {

        const lower = text.toLowerCase();

        if (lower.includes("goal"))
            return "goals";

        if (lower.includes("project"))
            return "projects";

        if (lower.includes("mission"))
            return "mission";

        if (lower.includes("strength"))
            return "strengths";

        if (lower.includes("challenge"))
            return "challenges";

        if (lower.includes("relationship"))
            return "relationships";

        return "conversation";
    }

}

export const MemoryType = new MemoryClassifier();