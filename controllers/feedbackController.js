// controllers/feedbackController.js
const feedbackService = require('../services/feedbackService');

exports.addFeedback = async (req, res) => {
    try {
        const { messageId, feedback } = req.body;

        // 요청 데이터 검증
        if (!messageId || !feedback) {
            return res.status(400).json({ message: "messageId와 feedback을 제공해야 합니다." });
        }

        const newFeedback = await feedbackService.addFeedback(messageId, feedback);
        res.status(201).json({ message: "피드백이 성공적으로 추가되었습니다.", feedback: newFeedback });
    } catch (error) {
        console.error('피드백 추가 중 에러:', error);
        res.status(500).json({ message: error.message || "피드백 추가 중 에러가 발생했습니다." });
    }
};

exports.getFeedbackByMessageId = async (req, res) => {
    try {
        const { messageId } = req.params;
        const feedback = await feedbackService.getFeedbackByMessageId(messageId);
        res.status(200).json({ feedback });
    } catch (error) {
        console.error('피드백 조회 중 에러:', error);
        res.status(500).json({ message: error.message || "피드백 조회 중 에러가 발생했습니다." });
    }
};
