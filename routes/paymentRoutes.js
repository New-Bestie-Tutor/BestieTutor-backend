const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // JWT 검증 미들웨어

// 결제 요청
router.post('/request', authMiddleware, paymentController.requestPayment);

// 결제 검증
router.post('/verify', authMiddleware, paymentController.verifyPayment);

module.exports = router;