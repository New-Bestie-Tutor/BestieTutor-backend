const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/getResponse', conversationController.getResponse);

router.post('/initialize', conversationController.initializeConversation);

router.post('/addUserMessage', conversationController.addUserMessage);

router.get('/getAllConversations/:email', conversationController.getAllConversations);

router.get('/getConversationById/:converse_id', conversationController.getConversationById);

module.exports = router;