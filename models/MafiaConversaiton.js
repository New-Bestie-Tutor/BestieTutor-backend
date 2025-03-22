const mongoose = require('mongoose');

const MafiaConversationSchema = new mongoose.Schema({
    game_id: { type: String, required: true },
    user_id: { type: String, required: true },
    role: { type: String, enum: ["Citizen", "Mafia", "Police", "Doctor", "Host"], required: true },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "MafiaMessage" }],
}, { timestamps: true });;

const MafiaConversation = mongoose.model('MafiaConversation', MafiaConversationSchema);

module.exports = MafiaConversation;