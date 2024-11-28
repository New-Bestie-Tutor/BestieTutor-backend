const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/getResponse', conversationController.getResponse);

router.post('/initialize', conversationController.initializeConversation);

router.post('/addUserMessage', conversationController.addUserMessage);

router.get('/getConversationHistory/:email', conversationController.getConversationHistory);

module.exports = router;