/*
====================================================
LifeOS Insight Engine v1
====================================================
*/

export class InsightEngine {

    analyze(profile) {

        const insights = [];

        if (profile.goals.length > 3) {
            insights.push(
                "You have several active goals. Consider focusing on one before adding another."
            );
        }

        if (profile.projects.length > 5) {
            insights.push(
                "You have many active projects. Finishing one may create more momentum than starting another."
            );
        }

        if (profile.challenges.length > profile.strengths.length) {
            insights.push(
                "Your recent conversations mention more challenges than strengths. Take time to recognize recent wins."
            );
        }

        if (insights.length === 0) {
            insights.push(
                "You are building steady momentum. Keep moving forward."
            );
        }

        return insights;
    }
}

export const CoachInsights = new InsightEngine();