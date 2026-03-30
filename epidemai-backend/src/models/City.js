import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  state: String,
  lat: Number,
  lng: Number,
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ["high", "moderate", "low"], default: "low" },
  mentions: { type: Number, default: 0 },
  diseases: [{ name: String, cases: Number, trend: { type: String, enum: ["up", "down", "stable"] } }],
  symptoms: [String],
  news: [{ title: String, source: String, time: String }],
  prediction7d: [Number],
  population: String,
}, { timestamps: true });

export default mongoose.model("City", citySchema);
