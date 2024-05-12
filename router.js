const router = require("express").Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const Message = require("./schema/message");
const User = require("./schema/user");

router.get("/users", async (req, res) => {
  try {
    // Search all users
    const users = await User.find();

    let res_users = users
      .filter((user) => user._id.toString() !== req.user.user_id.toString())
      .map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
        prevstatus: user.prevstatus,
      }));

    // Return the users
    res.status(200).json({ users: res_users });
  } catch (error) {
    // If an error occurs, return a 500 status with an error message
    res.status(500).json({ message: error.message });
  }
});

router.patch("/user/update/status", async (req, res) => {
  try {
    const id = req.user.user_id;
    const status = req.body.status;
    if (!status || (status !== "AVAILABLE" && status !== "BUSY")) {
      return res.status(400).json({
        message: "Status is required and must be 'AVAILABLE' or 'BUSY'",
      });
    }

    // Use await to wait for the update operation to complete
    const response = await User.findByIdAndUpdate(
      { _id: id },
      { status: status }
    );

    // response will be null if no document matched the query
    if (!response) {
      return res.status(404).json({ message: "Something Bad Happened" });
    }

    console.log(id);
    return res.status(200).json({ message: "Status updated" });
  } catch (error) {
    // Catch any errors that occur during the update operation
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/message", async (req, res) => {
  try {
    if (!req.body.to || !req.body.message) {
      return res.status(400).json({ message: "to and message are required" });
    }
    const from = req.user.user_id;
    const to = req.body.to;

    const user = await User.findById(to);

    if (user.status == "BUSY") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt =
        "Actually i am busy is something can you please give response to this text:" +
        req.body.message;

      const resultPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Timeout"));
        }, 10000); // 10 seconds timeout
      });

      const result = await Promise.race([resultPromise, timeoutPromise]);

      if (result instanceof Error && result.message === "Timeout") {
        // Handle timeout
        const response = await Message.create({
          sender: from,
          recipient: to,
          content: "Sorry, the user is currecntly not available.",
        });

        if (!response) {
          return res.status(500).json({ message: "Something went wrong" });
        }

        return res.status(200).json({ message: "Message sent" });
      } else {
        const responseText = await result.response.text(); // Changed variable name here
        const response = await Message.create({
          sender: from,
          recipient: to,
          content: responseText, // Used responseText instead of text
        });

        console.log(responseText);

        if (!response) {
          return res.status(500).json({ message: "Something went wrong" });
        }

        return res.status(200).json({ message: "Message sent" });
      }
    } else {
      const message = req.body.message;
      const response = await Message.create({
        sender: from,
        recipient: to,
        content: message,
      });

      if (!response) {
        return res.status(500).json({ message: "Something went wrong" });
      }

      return res.status(200).json({ message: "Message sent" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/messages", async (req, res) => {
  try {
    console.log(req.query);
    const senderId = req.user.user_id;
    const receiverId = req.query.receiverId;

    const messages = await Message.find({
      $or: [
        { sender: senderId, recipient: receiverId },
        { sender: receiverId, recipient: senderId },
      ],
    });

    return res.status(200).json({ messages: messages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
