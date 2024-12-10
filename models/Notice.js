const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
    noticeId: { type: String, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
}, {timestamps: true});

NoticeSchema.pre('save', function(next) {
    this.noticeId = this._id; // _id를 noticeId로 설정
    next();
});

const Notice = mongoose.model('Notice', NoticeSchema);
module.exports = Notice;