// chatName
// isGroupChat
// user
// latestMessage
// groupAdmin
const mongoose = require("mongoose");
const chatSchema = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [
      //for array of userss
      {
        type: mongoose.Schema.Types.ObjectId, //will contain the reference or id of that particular user who is a part of the group chat. A single user will be stored into our database right so we will reference it to that particular users
        ref: "User", //reference to the user model  (reference to that user model)
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId, //this will be the message which is stored in our database so we will reference it with the object id
      ref: "Message", //reference to the message model (reference to that message model)
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId, //contains the id of the particular group admin
      ref: "User", //reference to the user model  (reference to that user model)
    },
  },
  {
    timestamps: true,              //adding time stamp for every message
  }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
