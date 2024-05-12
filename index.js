const express = require("express");
const cors = require("cors");
const http = require("http");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("./schema/message");

const socketIo = require("socket.io");
const morgan = require("morgan");
const router = require("./router");
const { createNewUser, signIn } = require("./handlers/auth");
const { protect } = require("./modules/auth");
const connectToDatabase = require("./Database/config");
require("dotenv").config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectToDatabase();

app.post("/signup", createNewUser);
app.post("/signin", signIn);

app.use("/api", protect, router);
const connectedUsers = new Map();

const User = require("./schema/user");

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("userLoggedIn", ({ userId }) => {
    console.log(`User ${userId} logged in`);
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
  });

  socket.on("sendMessage", async ({ to, message }) => {
    try {
      const from = socket.userId;
      const user = await User.findById(to);

      if (!user) {
        return socket.emit("messageResponse", {
          success: false,
          message: "User not found",
        });
      }

      console.log(user);
      if (user.status === "BUSY") {
        // Handle busy case
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt =
          "Actually I am busy, can you please respond to this text: " + message;

        const resultPromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout"));
          }, 10000); // 10 seconds timeout
        });

        const result = await Promise.race([resultPromise, timeoutPromise]);

        if (result instanceof Error && result.message === "Timeout") {
          // Handle timeout
          await Message.create({
            sender: from,
            recipient: to,
            content: "Sorry, the user is currently not available.",
          });

          // **Always emit incoming message notification to recipient**
          socket.emit("incomingMessage", {
            content: responseText,
            from: to,
          });

          socket.emit("messageResponse", {
            success: true,
            message: "Message sent",
          });
        } else {
          const responseText = await result.response.text();
          console.log(responseText);
          await Message.create({
            sender: from,
            recipient: to,
            content: responseText,
          });

          socket.emit("incomingMessage", {
            content: responseText,
            from: to,
          });

          socket.emit("messageResponse", {
            success: true,
            message: "Message sent",
          });
        }
      } else {
        await Message.create({ sender: from, recipient: to, content: message });

        // Emit to the recipient's socket for the message
        const recipientSocketId = connectedUsers.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("incomingMessage", {
            content: message,
            from: from, // Make sure you're sending the 'from' field
          });
        }

        socket.emit("messageResponse", {
          success: true,
          message: "Message sent",
        });
      }
    } catch (error) {
      socket.emit("messageResponse", {
        success: false,
        message: error.message,
      });
    }
  });

  socket.on("getMessages", async ({ from, to }) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: from, recipient: to },
          { sender: to, recipient: from },
        ],
      });
      console.log(messages);
      // Emit the messages to the client
      socket.emit("messages", {
        success: true,
        messages: messages,
      });
    } catch (error) {
      socket.emit("messages", {
        success: false,
        message: error.message,
      });
    }
  });

  socket.on("userStatusUpdate", async ({ status }) => {
    console.log(status);
    try {
      const userId = socket.userId;
      const user = await User.findById(socket.userId);
      await User.findByIdAndUpdate(
        { _id: userId },
        { status: status },
        { prevstatus: user.status }
      );

      io.sockets.emit("userStatusUpdated", {
        userId: userId,
        status: status,
      });
    } catch (error) {
      console.error("Error:", error);
    }
  });

  // other socket event handlers...

  socket.on("disconnect", async () => {
    // When a user disconnects, update the user's status in the database
    try {
      console.log(socket.userId);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        const user = await User.findById(socket.userId);
        if (user) {
          const response = await User.findByIdAndUpdate(
            { _id: socket.userId },
            { status: user.prevstatus }
          );
          console.log("User status updated successfully");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
    console.log("A user disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
