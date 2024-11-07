const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// 공지사항 추가
router.post('/', noticeController.addNotice);

// 공지사항 수정
router.put('/:noticeId', noticeController.updateNotice);

// 공지사항 삭제
router.delete('/:noticeId', noticeController.deleteNotice);

// 전체 공지사항 조회
router.get('/', noticeController.getAllNotice);

// 특정 공지사항 조회
router.get('/:noticeId', noticeController.getNotice);

module.exports = router;