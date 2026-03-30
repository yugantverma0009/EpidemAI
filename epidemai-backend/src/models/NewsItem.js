import mongoose from "mongoose";

const newsItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  source: String,
  time: String,
  disease: String,
  severity: { type: String, enum: ["high", "moderate", "low"] },
}, { timestamps: true });

export default mongoose.model("NewsItem", newsItemSchema);
