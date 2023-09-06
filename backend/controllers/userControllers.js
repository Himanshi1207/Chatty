// if there is any error in the controller we need to handle those errors so there is a package called express-async-handler which handles all of the errors for us automatically
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
// /api/user post request
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the fields");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw Error("User already exists");
  }

  //   creating a new user if it doesn't exist previously
  //   we are creating a new field in the database
  const user = await User.create({
    name,
    email,
    password,
    pic,
  });
  //   if the user is created successfully then we are returning the status as 201 and sending the user details to the user
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      //   when it registers a new user i want it to create a new JWT token and send it to our user
      // jwt basically allows us to authenticate the user in our backend
      // for example we have logged in with a user but user is trying to access a resource that is only available to him so what jwt will do user will send a jwt to the backend and backend will verify that okay this is the user that is authorized to access this particular resource so only then the user will be allowed to access that resource
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create the user");
  }
});
// /api/user/login route
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});
// /api/user is the route get request
// how are we going to send the data to the backend
// there are two ways to send it either we can send through the body for that we have to use the post request
// second way is to make use of queries for making the api we will type "?" and we can provide variable after ?
// for example /api/user?search=himanshi
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          // options:'i' means we want it to be case sensitive
          // Provides regular expression capabilities for pattern matching strings in queries. MongoDB uses Perl compatible regular expressions (i.e. "PCRE" ) version 8.42 with UTF-8 support.
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // query the database
  // {$ne:req.user._id} means that return all the user except the one which is logged in $ne means not equal to
  // we have to authorise the user that is currently logged in and for doing that we need user to log in and provide us the jwt to authorise we need a middleware
  const user = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(user);
});
module.exports = { registerUser, authUser, allUsers }; 
