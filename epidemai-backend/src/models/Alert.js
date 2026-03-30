import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  severity: { type: String, enum: ["high", "moderate", "low"], required: true },
  title: { type: String, required: true },
  location: String,
  region: String,
  confidence: { type: Number, default: 0 },
  time: String,
  description: String,
  dismissed: { type: Boolean, default: false },
  signalSource: { news: Number, social: Number },
  recommendations: [String],
}, { timestamps: true });

export default mongoose.model("Alert", alertSchema);
