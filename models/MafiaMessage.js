const mongoose = require('mongoose');

const MafiaMessageSchema = new mongoose.Schema({
    message_id: { type: String, unique: true },
    message: { type: String, required: true },
    message_type: { 
        type: String, 
        enum: ['USER', 'BOT'],
        required: true 
    },
    role: { 
        type: String, 
        enum: ['HOST', 'MAFIA', 'POLICE', 'DOCTOR', 'CITIZEN', 'CITIZEN1', 'CITIZEN2', 'CITIZEN3'], // BOT일 경우 직업 구분
        required: function() { return this.message_type === 'BOT'; } // BOT일 때만 필수
    },
    name: { type: String },
    input_date: { type: Date, required: true },
}, { timestamps: true });

const MafiaMessage = mongoose.model('MafiaMessage', MafiaMessageSchema);

module.exports = MafiaMessage;