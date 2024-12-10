const mongoose = require('mongoose');


const EventSchema = new mongoose.Schema({
    eventId: { type: String, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
}, {timestamps: true});

EventSchema.pre('save', function(next) {
    this.eventId = this._id; // _id를 eventId로 설정
    next();
});

const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;