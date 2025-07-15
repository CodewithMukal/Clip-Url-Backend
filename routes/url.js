import express from "express";
import { nanoid } from "nanoid";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { getAllInfo } from "../controller/url.js";

const urlrouter = express.Router();

urlrouter.post("/allInfo", getAllInfo);

urlrouter.post("/", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const url = req.body.url;
    const alias = req.body.alias;
    if (alias.length > 0 && alias.length < 10) {
      
        if (!url) {
          return res.status(400).json({ error: "URL is required" });
        }
        // Check if the alias already exists
        const shortid = alias;
        const exist = await User.findOne({
          "generatedURL.shortID": shortid,
        });
        if (exist) {
          return res.status(400).json({ error: "Alias already exists" });
        }
        user.generatedURL.push({ orgUrl: url, shortID: shortid });
        await user.save();
        return res.status(201).json({ shortID: shortid, orgUrl: url });
        
    }
    else{
        if(!url)
            {
                return res.status(400).json({error: "URL is required"});
            }
        const shortid = nanoid(6);
        await user.generatedURL.push({orgUrl: url, shortID: shortid});
        await user.save();

        return res.status(201).json({shortID: shortid, orgUrl: url});
    }
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
});
export default urlrouter;
