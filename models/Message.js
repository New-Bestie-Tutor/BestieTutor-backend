const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    message_id: { type: Number, unique: true },
    converse_id: { type: Number, required: true, ref: 'Conversation' }, // Conversation 모델과 연결
    message: { type: String, required: true },
    message_type: { 
        type: String, 
        enum: ['USER', 'BOT'], // USER와 BOT으로 message type 제한
        required: true 
    },
    input_date: { type: Date, required: true },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;