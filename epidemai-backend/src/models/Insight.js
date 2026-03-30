import mongoose from "mongoose";

const insightSchema = new mongoose.Schema({
  type: { type: String, enum: ["trend", "anomaly", "prediction", "seasonal"], required: true },
  title: { type: String, required: true },
  description: String,
  confidence: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Insight", insightSchema);
