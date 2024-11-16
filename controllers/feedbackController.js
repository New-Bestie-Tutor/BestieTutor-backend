const Feedback = require('../models/Feedback');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { v4: uuidv4 } = require('uuid');

// 사용자 메시지에 대한 피드백 생성
exports.addFeedback = async (req, res) => {
    try {
        const { messageId, feedback } = req.body;

        // 요청 데이터 검증
        if (!messageId || !feedback) {
            return res.status(400).json({ message: "messageId와 feedback을 제공해야 합니다." });
        }

        // 메시지 확인
        const message = await Message.findOne({ message_id: messageId });
        if (!message) {
            return res.status(404).json({ message: "해당 메시지를 찾을 수 없습니다." });
        }

        // Conversation 확인
        const conversation = await Conversation.findById(message.converse_id);
        if (!conversation) {
            return res.status(404).json({ message: "해당 Conversation을 찾을 수 없습니다." });
        }

        // 기존 피드백 중복 확인
        const existingFeedback = await Feedback.findOne({ message_id: messageId });
        if (existingFeedback) {
            return res.status(409).json({ message: "이미 해당 메시지에 대한 피드백이 존재합니다." });
        }

        // 피드백 저장
        const newFeedback = new Feedback({
            feedbackId: uuidv4(),
            converse_id: message.converse_id,
            message_id: messageId,
            feedback,
            start_time: new Date(),
        });

        await newFeedback.save();

        res.status(201).json({ message: "피드백이 성공적으로 추가되었습니다.", feedback: newFeedback });
    } catch (error) {
        console.error('피드백 추가 중 에러:', error);
        res.status(500).json({ message: "피드백 추가 중 에러가 발생했습니다." });
    }
};

// 특정 메시지의 피드백 조회
exports.getFeedbackByMessageId = async (req, res) => {
    try {
        const { messageId } = req.params;

        const feedback = await Feedback.findOne({ message_id: messageId });
        if (!feedback) {
            return res.status(404).json({ message: "해당 메시지에 대한 피드백을 찾을 수 없습니다." });
        }

        res.status(200).json({ feedback });
    } catch (error) {
        console.error('피드백 조회 중 에러:', error);
        res.status(500).json({ message: "피드백 조회 중 에러가 발생했습니다." });
    }
};