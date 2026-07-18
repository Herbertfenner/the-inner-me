/*
====================================================
LifeOS Identity Engine v2
====================================================
*/

const STORAGE_KEY = "lifeos-builder-profile-v1";

const emptyProfile = () => ({
    name: "",
    mission: "",
    season: "",
    strengths: [],
    challenges: [],
    goals: [],
    projects: [],
    relationships: [],
    identity: [],
    updatedAt: null
});

export class IdentityEngine {
    constructor(storageKey = STORAGE_KEY) {
        this.storageKey = storageKey;
        this.profile = this.load();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.storageKey));
            return saved && typeof saved === "object"
                ? { ...emptyProfile(), ...saved }
                : emptyProfile();
        } catch {
            return emptyProfile();
        }
    }

    save() {
        this.profile.updatedAt = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
        return this.getProfile();
    }

    update(type, value) {
        if (!(type in this.profile) || value == null) return this.getProfile();

        const cleanValue = String(value).trim();
        if (!cleanValue) return this.getProfile();

        if (Array.isArray(this.profile[type])) {
            const exists = this.profile[type].some(
                item => String(item).toLowerCase() === cleanValue.toLowerCase()
            );
            if (!exists) this.profile[type].push(cleanValue);
        } else {
            this.profile[type] = cleanValue;
        }

        return this.save();
    }

    getProfile() {
        return JSON.parse(JSON.stringify(this.profile));
    }

    clear() {
        this.profile = emptyProfile();
        localStorage.removeItem(this.storageKey);
        return this.getProfile();
    }
}

export const BuilderIdentity = new IdentityEngine();
