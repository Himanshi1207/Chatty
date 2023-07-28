const express = require("express");
const router = express.Router();
const { registerUser,authUser, allUsers } = require("../controllers/userControllers");
router.use(express.json());
const {protect}=require("../middlewares/authMiddleware")
// we will user router to create different different routes
// so there are two ways to do this if we directly want to add any get/post then we can just write router.get() or router.post() or if we want to chain multiple requests we can write router.route('/').get(()=>{}).post() provide the end point
router.route("/").post(registerUser).get(protect, allUsers); //registerUser is a controller or we can say the logic that is function
router.post('/login', authUser)        
//authUser a funtion to authenticate the user
// user searching api endpoint
// get request will first go through the protect middleware before moving to the allUsers request
module.exports = router;
