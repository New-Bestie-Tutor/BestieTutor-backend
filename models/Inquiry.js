const mongoose = require("mongoose");

const InquirySchema = new mongoose.Schema(
  {
    userId: { type: Number, ref: "User", required: true },
    category: { type: String, required: true },
    question: { type: String, required: true },
    askedAt: { type: Date, default: Date.now },
    answer: { type: String },
    answeredAt: { type: Date },
    isAnswered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const InquiryModel = mongoose.model("Inquiry", InquirySchema);
module.exports = InquiryModel;
