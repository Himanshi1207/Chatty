const express = require("express");
const { chats } = require("./data/data");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = express();
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
app.use(express.json()); //to accept JSON data
const colors = require("colors");
dotenv.config();
connectDB();
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const path = require("path");
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------Deployment----------------------

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, '/frontend/build')))
  app.get('*',(req,res)=>{
    res.sendFile(path.resolve(__dirname1, "frontend","build", "index.html"))
  })

} else {
  app.get("/", (req, res) => {
    res.send("api is running");
  });
}

// --------------------Deployment----------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(`server started ${PORT}`.yellow.bold)
);
const io = require("socket.io")(server, {
  // pingtimeout means the amt of time it will wait while being inactive
  //  for example if the user didn't send any msg for 60 seconds then it will close the connection to save the bandwidth
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});
io.on("connection", (socket) => {
  // here we are creating a new socket where frontend will send some data and will join a room
  // console.log("connected to socket.io")
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("user joined room:" + room);
    socket.emit("connected");
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });
  server.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
