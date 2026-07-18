/**
 * ======================================================
 * LifeOS Memory Engine v1
 * ======================================================
 */

export class MemoryEngine {

    constructor(storageKey = "lifeos.memory") {

        this.storageKey = storageKey;

        this.memories = [];

        this.load();

    }

    load() {

        const saved =
            localStorage.getItem(this.storageKey);

        if (!saved) {

            this.memories = [];

            return;

        }

        this.memories = JSON.parse(saved);

    }

    save() {

        localStorage.setItem(

            this.storageKey,

            JSON.stringify(this.memories)

        );

    }

    remember(memory) {

        const item = {

            id: crypto.randomUUID(),

            created: new Date().toISOString(),

            ...memory

        };

        this.memories.push(item);

        this.save();

        return item;

    }

    all() {

        return this.memories;

    }

    latest(limit = 10) {

        return [...this.memories]

            .reverse()

            .slice(0, limit);

    }

    clear() {

        this.memories = [];

        this.save();

    }

}

export const HouseMemory =

    new MemoryEngine();