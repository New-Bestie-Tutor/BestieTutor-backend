const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// 이벤트 추가
router.post('/', eventController.addEvent);

// 전체 이벤트 조회
router.get('/', eventController.getEvent);

// 특정 이벤트 수정
router.put('/:eventsId', eventController.updateEvent);

// 특정 이벤트 삭제
router.delete('/:eventsId', eventController.deleteEvent);

module.exports = router;