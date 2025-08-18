const { User } = require('./models'); // adjust to how you export models

(async () => {
  try {
    const test = await User.findOne({
      where: { email: "aniketkr5155@gmail.com" }
    });

    console.log("RESULT:", test ? test.toJSON() : "No user found");
  } catch (err) {
    console.error("Error while querying user:", err);
  }
})();
