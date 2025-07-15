import express from "express";
import { login, logout, register, update, changePassword, forgotPassword, tokenCheck,resetPassword } from "../controller/user.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

const userrouter = express.Router();

userrouter.post("/register", register);
userrouter.post("/login", login);
userrouter.post("/logout", logout);
userrouter.patch('/update', update);
userrouter.patch('/change-password', changePassword);
userrouter.post('/forgot-password', forgotPassword);
userrouter.get('/reset-password/:id/:token', tokenCheck);
userrouter.patch('/reset-password',resetPassword)
userrouter.get('/info', async (req, res) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        console.log("❌ No token found in cookies");
        return res.json({ loggedIn: false });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const user = await User.findById(decoded.id);
  
      if (!user) {
        console.log("❌ User not found with ID:", decoded.id);
        return res.json({ loggedIn: false });
      }
  
      return res.json({
        loggedIn: true,
        user: {
          username: user.username,
          email: user.email,
        },
      });
    } catch (err) {
      console.error("🔥 Error in /info route:", err.message);
      return res.json({ loggedIn: false });
    }
  });
  

export default userrouter;
