const bcrypt = require('bcryptjs')

const verifyData = async (data, hashedData) => {
  try {
    return await bcrypt.compare(data, hashedData);
  } catch (error) {
    console.error(`Failed to verify data: ${error}`);
    throw new Error('Verification error');
  }
};

module.exports = verifyData;
