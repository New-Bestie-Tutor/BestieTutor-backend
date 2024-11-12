const express = require('express');
const preferenceController = require('../controllers/preferenceController');
const router = express.Router();

// 선호도 조사 생성
router.post('/', preferenceController.createPreferences);

// 특정 사용자 선호도 조회
router.get('/:userId', preferenceController.getPreferences);

// 특정 사용자 선호도 수정
router.put('/:userId', preferenceController.updatePreferences);

module.exports = router;