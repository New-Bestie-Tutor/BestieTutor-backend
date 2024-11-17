const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const feedbackController = require('../controllers/feedbackController');

router.post('/getResponse', conversationController.getResponse);

router.post('/addFeedback', feedbackController.addFeedback);

module.exports = router;