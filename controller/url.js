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
    return res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
  }
};

export const deleteLink = async (req, res) => {
  const { shortID } = req.params;
  const token  = req.cookies.token;

  if (!token || !shortID) {
    return res.json({
      status: "failed",
      message: "Can't delete without auth or shortID",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.warn("User not found for ID:", decoded.id);
      return res.json({ status: "failed", message: "User not logged in!" });
    }

    const updateResult = await User.updateOne(
      { _id: user._id },
      { $pull: { generatedURL: { shortID } } }
    );

    return res.json({
      status: "success",
      message: `${shortID} has been removed.`,
    });
  } catch (err) {
    console.error("Error deleting link:", err);
    return res.json({ status: "failed", message: `Server error: ${err.message}` });
  }
};

export const editLink = async (req,res) => {
  const {shortID} = req.params
  const { newID } = req.body
  const token = req.cookies.token
  if(!token)
    {
      return res.json({status:"failed",message:"Not authorized!"})
    }
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if(!user)
      {
        return res.json({status:"failed",message:"user not found!"})
      }
    
    await User.updateOne({_id: user._id, "generatedURL.shortID": shortID},
      {
        $set : {
          "generatedURL.$.shortID" : newID
        }
      }
    )
    return res.json({status:"success"})
  }
  catch(err)
  {
    return res.json({status:"failed",message:`Error: ${err}`})
  }
}