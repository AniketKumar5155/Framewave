const {User} = require('../models')

const allowedFields = ['username', 'first_name', 'last_name', 'bio', 'profile_image']

const getProfileService = async (username) => {
  const user = await User.findOne({
    where: { 
      username
     },
    attributes: ['id', 'username', 'first_name', 'last_name', 'bio', 'profile_image']
  });

  if (!user) throw new Error('User not found');

  return user;
};

const updateProfileService = async (username, updatedProfileData) => {
  const user = await User.findOne({
    where: {
      username
    }
  });

  if(!user) throw new Error('User not found')

    const updatedData = {}
    allowedFields.forEach((field)=>{
      if(field in updatedProfileData){
        updatedData[field] = updatedProfileData[field]
      }
    })

   await user.update(updatedData)
    return user;
}

module.exports = {
    getProfileService,
    updateProfileService
}
