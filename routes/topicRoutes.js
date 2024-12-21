const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

// 대주제 조회
router.get('/', topicController.getTopics);

// 소주제 및 난이도 선택, 설명 안내
router.get('/:mainTopic', topicController.getSubTopics);

module.exports = router;