const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/getResponse', conversationController.getResponse);

router.get('/getConversationHistory/:email', conversationController.getConversationHistory);

module.exports = router;