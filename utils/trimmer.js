const trimmer = (payload) => {
    if (typeof payload === 'string') {
        return payload.trim();
    }
    else if (Array.isArray(payload)) {
        return payload.map(item => trimmer(item));
    }
    else if (typeof payload === 'object' && payload !== null) {
        const trimmedObj = {};
        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                trimmedObj[key] = trimmer(payload[key]);
            }
        }
        return trimmedObj;
    }
    return payload;
};

module.exports = trimmer;
