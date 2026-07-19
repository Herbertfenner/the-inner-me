/*
====================================================
LifeOS Builder Profile v2
====================================================
*/

import { BuilderIdentity } from "../engine/identity.js";

export class BuilderProfile {
    setName(value) { return BuilderIdentity.update("name", value); }
    setMission(value) { return BuilderIdentity.update("mission", value); }
    setSeason(value) { return BuilderIdentity.update("season", value); }
    addGoal(value) { return BuilderIdentity.update("goals", value); }
    addProject(value) { return BuilderIdentity.update("projects", value); }
    addStrength(value) { return BuilderIdentity.update("strengths", value); }
    addChallenge(value) { return BuilderIdentity.update("challenges", value); }
    addRelationship(value) { return BuilderIdentity.update("relationships", value); }
    addIdentity(value) { return BuilderIdentity.update("identity", value); }

    apply(type, value) {
        const actions = {
            mission: () => this.setMission(value),
            season: () => this.setSeason(value),
            goals: () => this.addGoal(value),
            projects: () => this.addProject(value),
            strengths: () => this.addStrength(value),
            challenges: () => this.addChallenge(value),
            relationships: () => this.addRelationship(value),
            identity: () => this.addIdentity(value)
        };

        return actions[type] ? actions[type]() : this.getProfile();
    }

    getProfile() {
        return BuilderIdentity.getProfile();
    }

    clear() {
        return BuilderIdentity.clear();
    }
}

export const Builder = new BuilderProfile();
