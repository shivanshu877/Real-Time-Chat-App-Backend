const mongoose = require("mongoose");

// Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  status: {
    type: String,
    enum: ["AVAILABLE", "BUSY", "ONLINE"],
    default: "AVAILABLE",
  },
  prevstatus: { type: String, default: "AVAILABLE" },
  // Add more fields as needed
});

module.exports = mongoose.model("User", userSchema);
