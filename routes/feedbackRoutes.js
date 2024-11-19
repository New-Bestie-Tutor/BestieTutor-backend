// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// 피드백 추가
router.post('/', feedbackController.addFeedback);

// 특정 메시지의 피드백 조회
router.get('/:messageId', feedbackController.getFeedbackByMessageId);

module.exports = router;
