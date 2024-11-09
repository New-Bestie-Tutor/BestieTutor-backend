const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');

// 캐릭터 조회
router.get('/', characterController.getCharacters);

// 캐릭터 추가
// router.post('/', characterController.addCharacter);

module.exports = router;