import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      unique: false,
    },
    generatedURL: [
      new mongoose.Schema({
        orgUrl: {
          type: String,
          required:true,
        },
        shortID: {
          type: String,
          required: true,
        },
        visitHistory:[
          {
            clickedOn: {
              type: Date,
            }
          }
        ]
      },{timestamps: true})
    ],
    verifyOTP: {
      type: String,
      default: "",
    },
    verifyOTPExpireAt: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetOTP: {
      type: String,
      default: "",
    },
    resetOTPExpireAt: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.user || mongoose.model("user", UserSchema);

export default User;
