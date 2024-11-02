const mongoose = require('mongoose');


const NoticeSchema = new mongoose.Schema({
    noticeId: { type: Number, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
}, {timestamps: true});


const NoticeModel = mongoose.model('Notice', NoticeSchema);
module.exports = NoticeModel;