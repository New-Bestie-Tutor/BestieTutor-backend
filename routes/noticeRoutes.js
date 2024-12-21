const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// 전체 공지사항 조회
router.get('/', noticeController.getAllNotice);

// 특정 공지사항 조회
router.get('/:noticeId', noticeController.getNotice);

module.exports = router;