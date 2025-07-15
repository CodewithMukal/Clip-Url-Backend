import jwt from "jsonwebtoken";
import User from "../models/user.js"; // ensure correct path

export const getAllInfo = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({ status: "failed", message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id); // ← await is CRUCIAL

    if (!user) {
      return res.json({ status: "failed", message: "User not found" });
    }

    console.log("Found user:", user.username);

    // Send back the URLs
    return res.json({
      status: "success",
      user: {
        username: user.username,
        email: user.email,
        urls: user.generatedURL,
      },
    });
  } catch (err) {
    console.error("Error in getAllInfo:", err);
    return res.status(500).json({ status: "failed", message: "Internal Server Error" });
  }
};
