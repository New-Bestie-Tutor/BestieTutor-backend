const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    converse_id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // User 모델의 userId와 연결
    start_time: { type: Date, required: true },
    end_time: { type: Date, default: null },
    topic_description: { type: String, required: true, ref: 'Topic' }, // Topic 모델과 연결
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;