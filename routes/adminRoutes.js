const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

// 대주제 추가
router.post('/topic', topicController.addTopic);

module.exports = router;