const trimmer = (payload, seen) => {
    if (!(seen instanceof WeakSet)) {
        seen = new WeakSet();
    }

    if (typeof payload === 'string') {
        return payload.trim();
    }
    else if (Array.isArray(payload)) {
        if (seen.has(payload)) return payload;
        seen.add(payload);
        return payload.map(item => trimmer(item, seen));
    }
    else if (typeof payload === 'object' && payload !== null) {
        if (seen.has(payload)) return payload;
        seen.add(payload);
        const trimmedObj = {};
        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                trimmedObj[key] = trimmer(payload[key], seen);
            }
        }
        return trimmedObj;
    }
    return payload;
};

module.exports = trimmer;
