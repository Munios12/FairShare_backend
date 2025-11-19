const User = require("../models/user");

exports.getAllUsers = async (req, res) => {
  try {
    const usersList = await User.findAll();

    //RESPONSE
    res.status(200).json({
      status: "success",
      result: usersList.length,
      data: {
        users: usersList,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error.message,
    });
  }
};
