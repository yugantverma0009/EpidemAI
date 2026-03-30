import mongoose from "mongoose";

const trendDataSchema = new mongoose.Schema({
  month: { type: String, required: true },
  dengue: { type: Number, default: 0 },
  flu: { type: Number, default: 0 },
  tb: { type: Number, default: 0 },
  covid: { type: Number, default: 0 },
  malaria: { type: Number, default: 0 },
});

export default mongoose.model("TrendData", trendDataSchema);
