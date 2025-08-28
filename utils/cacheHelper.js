const {
    lPushCache,
    lRemCache,
    lRangeCache,
    delCache,
} = require('./redisCache')

const dataToManipulate = (data, entityId) => {
    return data.map(d => JSON.parse(d)).find(d => d.id === entityId)
}

const addToCache = async (entity, redisKeys) => {
    await Promise.all(redisKeys.map(key => lPushCache(key, entity)))
}

const removeItemFromCache = async (entityId, redisKeys) => {
    const cachedList = await Promise.all(redisKeys.map(key => lRangeCache(key, 0, -1)))
    const itemsToRemove = cachedList.map((list) => dataToManipulate(list, entityId));
    await Promise.all(itemsToRemove.map((item, i) => item && lRemCache(redisKeys[i], 1, item)));
}

const updateItemInCache = async (entity, redisKeys) => {
    await invalidateCache(redisKeys);
    await addToCache(entity, redisKeys)
}

const invalidateCache = async (redisKeys) => {
    await Promise.all(redisKeys.map(key => delCache(key)))
}

module.exports = {
    addToCache,
    removeItemFromCache,
    updateItemInCache,
    invalidateCache,
}