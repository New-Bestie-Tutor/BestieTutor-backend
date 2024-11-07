const Notice = require('../models/Notice');

// 공지사항 추가
exports.addNotice = async (title, content) => {
    const newNotice = new Notice({
        title,
        content,
        inputDate: new Date(),
        updateDate: new Date(),
    });
    await newNotice.save();
    return newNotice;
};

// 공지사항 수정
exports.updateNotice = async (noticeId, title, content) => {
    const updatedNotice = await Notice.findByIdAndUpdate(
        noticeId,
        { title, content, updateDate: new Date() },
        { new: true }
    );
    return updatedNotice;
};

// 공지사항 삭제
exports.deleteNotice = async (noticeId) => {
    const deletedNotice = await Notice.findByIdAndDelete(noticeId);
    return deletedNotice;
};

// 전체 공지사항 조회
exports.getAllNotices = async () => {
    const notices = await Notice.find().sort({ inputDate: -1 });
    return notices;
};

// 특정 공지사항 조회
exports.getNotice = async (noticeId) => {
    const foundNotice = await Notice.findById(noticeId);
    return foundNotice;
};
