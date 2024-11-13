const mongoose = require('mongoose');

const PreferenceSchema = new mongoose.Schema({
    userId: { type: Number, unique: true, ref: 'User', required: true },
    language: { type: String, required: true },
    learningGoals: { type: [String], required: true },
    preferredTopics: { type: [String], required: true },
    currentSkillLevel: { type: String, required: true }    
}, { timestamps: true });

module.exports = mongoose.model('Preference', PreferenceSchema);