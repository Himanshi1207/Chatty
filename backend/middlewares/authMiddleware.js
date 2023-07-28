const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // token looks something like this "Bearer basdjfwiuenfcx" where basdjfwiuenfcx is token
      //   using split [1] we are removing the bearer and taking the token only for decoding purpose
      // decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      //   return the user without the password
      req.user = await User.findById(decoded.id).select("-password");
      next(); //we will now perform allUser request
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});
module.exports = { protect };
