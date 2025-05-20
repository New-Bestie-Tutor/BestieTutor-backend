const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    appearance: { type: String, required: true },
    personality: { type: String, required: true },
    tone: { type: String, required: true },
    assistant_id: { type: String, default: null }
});

const Character = mongoose.model('Character', characterSchema);

module.exports = Character;