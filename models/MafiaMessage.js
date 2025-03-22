const mongoose = require('mongoose');

const MafiaMessageSchema = new mongoose.Schema({
    message_id: { type: String, unique: true },
    mafia_converse_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'MafiaConversation' }, // MafiaConversation 모델과 연결
    message: { type: String, required: true },
    message_type: { 
        type: String, 
        enum: ['USER', 'HOST', 'MAFIA', 'POLICE', 'DOCTOR', 'CITIZEN'], // 역할별 메시지 구분
        required: true 
    },
    input_date: { type: Date, required: true },
}, { timestamps: true });

const MafiaMessage = mongoose.model('MafiaMessage', MafiaMessageSchema);

module.exports = MafiaMessage;