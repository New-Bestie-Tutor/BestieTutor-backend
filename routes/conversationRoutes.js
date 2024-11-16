const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const feedbackController = require('../controllers/feedbackController');

router.post('/', conversationController.getResponse);

router.post('/', feedbackController.addFeedback);

module.exports = router;