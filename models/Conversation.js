const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    converse_id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    thread_id: { type: String, default: null },
    start_time: { type: Date, required: true },
    end_time: { type: Date, default: null },
    is_free_topic: { type: Boolean, default: false },
    topic_description: { type: String, required: true, ref: 'Topic' },
    description: { type: String, required: true },
    selected_language: { type: String, default: null },
    selected_character: { type: String, default: null },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;