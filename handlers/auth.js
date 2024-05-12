const User = require("../schema/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const activeSockets = new Map();

// Now you can emit events using `io.emit()` or listen to events using `io.on()`

const { comparePassword, createJWT, hashPassword } = require("../modules/auth");

const createNewUser = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password || !req.body.username) {
      return res
        .status(400)
        .json({ message: "Please provide an email, username, and password" });
    }
    const { email, username, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = new User({ email, username, password: hashedPassword });
    await user.save();
    console.log(user);
    const token = createJWT({ user_id: user._id, username: user.username }); // Access _id directly
    res.status(201).json({ token });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const signIn = async (req, res) => {
  try {
    console.log(req.body);
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userId = user._id; 

    // Update the user's status to "online"
    const response = await User.findByIdAndUpdate(
      { _id: userId },
      { status: "ONLINE" },
      { prevstatus: user.status }
      // Assuming "AVAILABLE" represents online status
    );

    // If the user is successfully updated
    if (response) {
    } else {
      // If no user is found with the provided ID
      console.error("User not found");
    }

    const token = createJWT({ user_id: user._id, username: user.username });

    let res_user = {
      id: user._id,
      username: user.username,
      email: user.email,
      status: user.status,
      prevstatus: user.prevstatus,
      token: token,
    };

    console.log(res_user);

    // Respond to the client accordingly
    res.status(200).json(res_user);
  } catch (error) {
    // Catch any errors that occur during the sign-in process
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { createNewUser, signIn };
