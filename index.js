import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import connectDB from './config/mongodb.js'
import userrouter from './routes/user.js'
import urlrouter from './routes/url.js'
import User from './models/user.js'

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.use(cors({credentials: true,origin:'https://clipurlx.vercel.app'}))


app.get("/",(req,res)=>
    {
        res.status(200).json({status:"Success"})
    }
)
app.get("/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    console.log("Looking for shortID:", shortId);
    if (!shortId) {
      return res.send({status: "failed", message: "Short ID is required"});
    }
    try {
      // Step 1: Find full user doc with that shortID
      const user = await User.findOne({ "generatedURL.shortID": shortId });
  
      if (!user) {
        console.log("Short ID not found in DB");
        return res.send({status: "failed", message: "Short ID not valid"});
      }
  
      // Step 2: Find the exact matched URL inside user's generatedURL array
      const matched = user.generatedURL.find(
        (url) => url.shortID === shortId
      );
  
      if (!matched || !matched.orgUrl) {
        return res.send({status: "failed", message: "Original URL not found"});
      }
  
      // Step 3: Push visit log
      if (!matched.visitHistory) matched.visitHistory = [];
      matched.visitHistory.push({ clickedOn: new Date() });
  
      // Step 4: Save user
      await user.save();
  
      // Step 5: Redirect
      return res.json({status:"success",orgUrl: matched.orgUrl});
    } catch (err) {
      console.error("🔥 Server exploded:", err);
      return res.status(500).send("Internal Server Error");
    }
  });
  
  
app.use("/api/user", userrouter)
app.use('/api/url',urlrouter)
app.listen(PORT,()=>
    {
        console.log(`Server started at http://localhost:${PORT}/`)
    }
)