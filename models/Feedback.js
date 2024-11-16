const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    feedbackId: { type: String, unique: true },
    converse_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation' },
    message_id: { type: String, unique: true, ref: 'Message' },
    feedback: { type: String, required: true },
    start_time: { type: Date, required: true },
}, {timestamps: true});

const FeedbackModel = mongoose.model('Feedback', FeedbackSchema);
module.exports = FeedbackModel;