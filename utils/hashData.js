const bcrypt = require('bcryptjs');

const hashData = async (data) => {
    try {
        const SALT_ROUND = 10;
        const hashedData = await bcrypt.hash(data, SALT_ROUND)

        return hashedData
    } catch (error) {
        throw new Error(`Failed to hash password: ${error}`);
    }
};

module.exports = hashData;
