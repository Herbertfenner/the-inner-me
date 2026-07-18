/*
====================================================
LifeOS Builder Profile v1
====================================================
*/

import { BuilderIdentity } from "../engine/identity.js";

export class BuilderProfile {

    setName(name) {
        BuilderIdentity.update("name", name);
    }

    setMission(mission) {
        BuilderIdentity.update("mission", mission);
    }

    setSeason(season) {
        BuilderIdentity.update("season", season);
    }

    addGoal(goal) {
        BuilderIdentity.update("goals", goal);
    }

    addProject(project) {
        BuilderIdentity.update("projects", project);
    }

    addStrength(strength) {
        BuilderIdentity.update("strengths", strength);
    }

    addChallenge(challenge) {
        BuilderIdentity.update("challenges", challenge);
    }

    getProfile() {
        return BuilderIdentity.getProfile();
    }
}

export const Builder = new BuilderProfile();