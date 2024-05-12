const mongoose = require("mongoose");

async function connectToDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/chat-app", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected 👋");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

module.exports = connectToDatabase;
