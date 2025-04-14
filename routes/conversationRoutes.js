const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/start', conversationController.startConversation); 
router.post('/:converseId/message', conversationController.sendUserMessage);
router.post('/:converseId/reply', conversationController.getAssistantReply);

router.get('/:email/history', conversationController.getUserConversations);
router.get('/:converseId', conversationController.getConversationDetail);

router.put('/:converseId/end', conversationController.markConversationEnded);

router.get('/languages/all', conversationController.getAllLanguages);
router.get('/languages/recent/:email', conversationController.getRecentLanguage);
router.put('/languages/change', conversationController.changeUserLanguage);

module.exports = router;