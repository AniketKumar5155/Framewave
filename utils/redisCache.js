const { client } = require('../config/redisClient');

const setCache = async (key, data, expiry = 30) => {
    try {
        await client.set(key, JSON.stringify(data), { EX: expiry });
    } catch (error) {
        console.error(`Redis setCache error for key:${key}:`, error);
    }
}

const getCache = async (key) => {
    try {
        const cacheData = await client.get(key);
        return cacheData ? JSON.parse(cacheData) : null;
    } catch (error) {
        console.error(`Redis getCache error for key:${key}:`, error);
        return null;
    }
}

const delCache = async (key) => {
    try {
        await client.del(key);
    } catch (error) {
        console.error(`Redis delCache error for key:${key}:`, error);
    }
}

const lPushCache = async (key, data) => {
    try {
        await client.lPush(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Redis lPushCache error for key:${key}:`, error);
    }
}

const lRemCache = async (key, data, count = 0) => {
    try {
        await client.lRem(key, count, JSON.stringify(data));
    } catch (error) {
        console.error(`Redis lRemCache error for key:${key}:`, error);
    }
}

const lRangeCache = async (key, start, end) => {
    try{
       return await client.lRange(key, start, end)
    }catch (error){
        console.log(`Redis lRange error for key:${key}:`, error)
    }
}

const lengthOfCache = async (key) => {
    try {
        return await client.lLen(key);
    } catch (error) {
        console.error(`Redis lLen error for key:${key}:`, error);
        return 0;
    }
}

module.exports = {
    setCache,
    getCache,
    delCache,
    lPushCache,
    lRemCache,
    lengthOfCache,
    lRangeCache,
};
