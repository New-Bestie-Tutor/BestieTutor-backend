const inquiryService = require("../services/inquiryService");

exports.getAllInquiries = async (req, res) => {
  try {
    const inquires = await inquiryService.getAllInquiries();
    if (!inquires) {
      return res.json({
        success: false,
        msg: "문의 사항 목록을 가져오는 데 실패했습니다.",
      });
    }
    res.json({ success: true, data: inquires });
  } catch (err) {
    res.json({
      success: false,
      msg: "서버 오류가 발생했습니다.",
      error: err.message,
    });
  }
};

exports.getInquiryById = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await inquiryService.getInquiryById(inquiryId);
    if (!inquiry) {
      return res.json({ success: false, msg: "문의 사항을 찾을 수 없습니다." });
    }
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.json({
      success: false,
      msg: "서버 오류가 발생했습니다.",
      error: err.message,
    });
  }
};

exports.createInquiry = async (req, res) => {
  try {
    const inquiryData = req.body;
    const userId = req.user.userId;
    const newInquiry = await inquiryService.createInquiry(inquiryData, userId);
    if (!newInquiry) {
      res.json({
        success: false,
        msg: "문의 사항을 등록하는 데 실패했습니다.",
      });
    }
    res.json({
      success: true,
      data: newInquiry,
      msg: "문의 사항이 성공적으로 등록되었습니다.",
    });
  } catch (err) {
    res.json({
      success: false,
      msg: "서버 오류가 발생했습니다.",
      error: err.message,
    });
  }
};

exports.deleteInquiryById = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const userId = req.user.userId;
    const result = await inquiryService.deleteInquiryById(inquiryId, userId);
    if (!result) {
      return res.json({
        success: false,
        msg: "삭제할 문의 사항을 찾을 수 없습니다.",
      });
    }
    res.json({ success: true, msg: "문의 사항이 성공적으로 삭제되었습니다." });
  } catch (err) {
    res.json({
      success: false,
      msg: "서버 오류가 발생했습니다.",
      error: err.message,
    });
  }
};
