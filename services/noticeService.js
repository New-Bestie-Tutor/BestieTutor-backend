const Notice = require("../models/Notice");

// 전체 공지사항 조회
exports.getAllNotices = async () => {
  const notices = await Notice.find().sort({ inputDate: -1 });
  return notices;
};

// 특정 공지사항 조회
exports.getNoticeById = async (noticeId) => {
  const foundNotice = await Notice.findById(noticeId);
  return foundNotice;
};
