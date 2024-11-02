const express = require('express');

const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/conversation', conversationController.getResponse);


module.exports = router;