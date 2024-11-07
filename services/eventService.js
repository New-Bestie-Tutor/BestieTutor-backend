const Event = require('../models/Event');

exports.addEvent = async (title, content) => {
    const newEvent = new Event({
        title, 
        content,
        inputDate: new Date(),
        updateDate: new Date(),
    });
    return await newEvent.save();
}

exports.getEvents = async () => {
    return await Event.find().sort({ inputDate: -1 }); // 최신순 정렬
}

exports.updateEvent = async (eventId, title, content) => {
    return await Event.findOneAndUpdate(
        { eventId: eventId },
        { title, content, updateDate: new Date() },
        { new: true }
    );
};

exports.deleteEvent = async (eventId) => {
    return await Event.findOneAndDelete(eventId);
};