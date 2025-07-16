import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../mailer.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.json({ status: "failed", message: "Missing Details" });
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.json({ status: "failed", message: "User already exists " });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPass });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  } catch (err) {
    res.json({ status: "failed", message: `Error: ${err.message}` });
  }
  return res.json({ status: "success" });
};

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.json({
      status: "failed",
      message: "Email and Password Required",
    });
  }
  try {
    
    const user = await User.findOne({ email });
    

    if (!user) {
      return res.json({ status: "failed", message: "Invalid Email!" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ status: "failed", message: "Invalid Password!" });
    }
    let token;
    if (rememberMe) {
      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
    } else {
      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
    }

    if (rememberMe) {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    } else {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 1 * 60 * 60 * 1000,
      });
    }

    return res.json({ status: "success" });
  } catch (err) {
    res.json({ status: "failed", message: `Error: ${err.message}` });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ status: "success", message: "Logged out" });
  } catch (err) {
    res.json({ status: "failed", message: err.message });
  }
};

export const update = async (req, res) => {
  const username = req.body.username;
  if (!username) {
    req.json({ status: "failed", message: "Username is required" });
  }
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.username = username;
    await user.save();

    return res
      .status(200)
      .json({ status: "success", message: "Username updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    return res.json({ status: "failed", message: "All fields are required" });
  }
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json({ status: "failed", message: "User not found" });
    }
    if (user.email !== email) {
      return res.json({ status: "failed", message: "Email does not match" });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.json({
        status: "failed",
        message: "Old password is incorrect",
      });
    }
    const hashedNewPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPass;
    await user.save();
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (err) {
    return res.json({ status: "failed", message: `Error: ${err.message}` });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    console.log("❌ No email provided in request.");
    return res.json({ status: "failed", message: "Email is required" });
  }

  try {
    console.log(`🔍 Looking up user with email: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ No user found with that email.");
      return res.json({ status: "failed", message: "Email not registered" });
    }

    console.log(`✅ User found: ${user.username} (${user._id})`);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const link = `https://clip-url-backend.onrender.com/api/user/reset-password/${user._id}/${token}`;
    console.log("🔗 Reset Link:", link);

    const html = `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password. This link is valid for 15 minutes. If you haven't made this request, ignore this mail.</p>
      <a href="${link}">${link}</a>
    `;

    console.log(`📧 Sending email to ${email}...`);
    const mailSent = await sendMail(email, "Reset Password", html);

    if (!mailSent) {
      console.log("❌ Failed to send email.");
      return res.json({ status: "failed", message: "Failed to send email" });
    }

    console.log("✅ Email sent successfully.");
    return res.json({
      status: "success",
      message: "Password reset link sent to your email",
    });

  } catch (err) {
    console.error("❌ Error in forgotPassword:", err.message);
    return res.json({ status: "failed", message: `Error: ${err.message}` });
  }
};

export const tokenCheck = async (req, res) => {
  const { id, token } = req.params;
  if (!id || !token) {
    res.send({ status: "failed", message: "Invalid Link Please Regenerate" });
  }
  const user = await User.findById(id);
  if (!user) {
    res.json({ status: "failed", message: "User doesnt exist" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect(`https://clipurlx.vercel.app/forgot-password/${id}/${token}`);
  } catch (err) {
    return res.send({ status: "success", verified: false });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      status: "failed",
      message: "Invalid request. Missing token or password.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User not found!" });
    }

    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedPass;
    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({
      status: "success",
      message: "Password reset successful.",
    });
  } catch (err) {
    return res
      .status(400)
      .json({ status: "failed", message: `Token error: ${err.message}` });
  }
};
