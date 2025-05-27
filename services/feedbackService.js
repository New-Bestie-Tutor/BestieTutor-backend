// services/feedbackService.js
const Feedback = require("../models/Feedback");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { v4: uuidv4 } = require("uuid");

class FeedbackService {
  async addFeedback(messageId, feedback) {
    // 메시지 확인
    const message = await Message.findOne({ message_id: messageId });
    if (!message) {
      throw new Error("해당 메시지를 찾을 수 없습니다.");
    }

    // Conversation 확인
    const conversation = await Conversation.findById(message.converse_id);
    if (!conversation) {
      throw new Error("해당 Conversation을 찾을 수 없습니다.");
    }

    // 기존 피드백 중복 확인
    const existingFeedback = await Feedback.findOne({ message_id: messageId });
    if (existingFeedback) {
      throw new Error("이미 해당 메시지에 대한 피드백이 존재합니다.");
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
    return newFeedback;
  }

  async getFeedbackByMessageId(messageId) {
    if (!messageId) {
      throw new Error("messageId가 제공되지 않았습니다.");
    }

    const feedback = await Feedback.findOne({ message_id: messageId });
    if (!feedback) {
      throw new Error(`메시지 ${messageId} 에 대한 피드백을 찾을 수 없습니다.`);
    }
    return feedback;
  }
}

module.exports = new FeedbackService();
