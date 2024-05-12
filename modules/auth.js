const jwt = require("jsonwebtoken");
const bycrypt = require("bcrypt");

const createJWT = (user) => {
  const token = jwt.sign(
    { user_id: user.user_id, username: user.username },
    process.env.JWT_SECRET
  );
  return token;
};

const hashPassword = async (password) => {
  const hashedPassword = await bycrypt.hash(password, 5);
  return hashedPassword;
};

const comparePassword = async (password, hashedPassword) => {
  return await bycrypt.compare(password, hashedPassword);
};

const protect = (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    res.status(401).json({ message: "You are not authorized" });
    return;
  }

  const [, token] = bearer.split(" ");
  if (!token) {
    res.status(401).json({ message: "You are not authorized" });
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "You are not authorized" });
    return;
  }
};

module.exports = { createJWT, hashPassword, comparePassword, protect };
