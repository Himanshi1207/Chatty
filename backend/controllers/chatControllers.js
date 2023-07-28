const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
// creating or fetching a one on one chat
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  //   check if a chat with this userId exist if it exist then return it or else create a chat with this userId
  if (!userId) {
    console.log("UserId param not sent with request");
    return res.statusCode(400);
  }
  //   checking if the chat exits with this userId
  var isChat = await Chat.find({
    isGroupChat: false,
    // checking both the currently loggedin user and the user id we are provided with
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } }, //current user logged in
      { users: { $elemMatch: { $eq: userId } } }, //the user id which we have sent
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");
  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });
  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createdChat = await Chat.create(chatData);

      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});
// in this fetchchat we just need to check which user is logged in and query for that user for all of the chats that are in th database
const fetchChat = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
// in this we are going to take a bunch of users from the body and we are going to take the name of the group chat
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }
  // we are going to send an array directly we need to send it in the stringify format so we are going to send it in the stringify format from our frontend and in our backend we're going to parse that stringify into an object
  var users = JSON.parse(req.body.users);
  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }
  // we are pushing the current user to the users as the person who is logged in and creating a grp will also be a part of the group
  users.push(req.user);

  // query to the database
  try {
    const gropuChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });
    const fullGroupChat = await Chat.findOne({ _id: gropuChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(updatedChat);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!added) {
    res.status(404);
    throw new Error("Chat not fount");
  } else {
    res.json(added);
  }
});
const removeFromGroup = asyncHandler(async (req, res) => {
   const { chatId, userId } = req.body;
   const removed = await Chat.findByIdAndUpdate(
     chatId,
     {
       $pull: { users: userId },
     },
     { new: true }
   )
     .populate("users", "-password")
     .populate("groupAdmin", "-password");
   if (!removed) {
     res.status(404);
     throw new Error("Chat not fount");
   } else {
     res.json(removed);
   } 
});
module.exports = {
  accessChat,
  fetchChat,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
