const Inquiry = require("../models/Inquiry");

exports.getAllInquiries = async () => {
  const inquires = await Inquiry.find().sort({ askedAt: -1 });
  if (!inquires) {
    return null;
  }
  return inquires;
};

exports.getInquiryById = async (inquiryId) => {
  const inquiry = await Inquiry.findById(inquiryId);
  if (!inquiry) {
    return null;
  }
  return inquiry;
};

exports.createInquiry = async (inquiryData, userId) => {
  const { category, question } = inquiryData;
  if (!category || !question) {
    throw new Error("카테고리와 질문 내용은 필수입니다.");
  }
  const newInquiry = new Inquiry({
    userId,
    category,
    question,
  });

  await newInquiry.save();
  return newInquiry;
};

exports.deleteInquiryById = async (inquiryId, userId) => {
  const inquiry = await Inquiry.findById(inquiryId);
  if (!inquiry) {
    return null;
  }
  if (inquiry.userId !== userId) {
    throw new Error("이 문의사항을 삭제할 권한이 없습니다.");
  }
  const result = await Inquiry.findByIdAndDelete(inquiryId);
  return result;
};
