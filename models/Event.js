const mongoose = require('mongoose');


const EventSchema = new mongoose.Schema({
    eventId: { type: Number, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
}, {timestamps: true});


const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;