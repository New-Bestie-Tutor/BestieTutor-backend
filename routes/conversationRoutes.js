const express = require('express');

const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/', conversationController.getResponse);

router.post('/evaluate');

module.exports = router;