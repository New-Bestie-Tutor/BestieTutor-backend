const paymentService = require('../services/paymentService');

exports.requestPayment = async (req, res) => {
  try {
    // 사용자 인증 확인
    if (!req.user) {
      console.error("Unauthorized: req.user is missing");
      return res.status(401).json({ success: false, message: "Unauthorized: User information is missing." });
    }

    const { userId, email, amount, paymentMethod } = req.body;

    // 요청 데이터 유효성 검사
    if (!amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: "필수 요청 데이터를 확인하세요." });
    }
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than zero." });
    }

    const validPaymentMethods = ["card", "transfer", "kakaopay"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method." });
    }

    // 디버깅 로그 추가
    console.log("Processing payment:", { userId, email, amount, paymentMethod });

    // 결제 요청 생성
    const response = await paymentService.createPaymentRequest(userId, email, amount, paymentMethod);

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Payment request error:", error.message);
    res.status(500).json({ success: false, message: "결제 요청 중 문제가 발생했습니다." });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { imp_uid, merchant_uid } = req.body;
    const userId = req.user?.id;

    if (!userId || !imp_uid || !merchant_uid) {
      return res.status(400).json({ success: false, message: '필수 요청 데이터를 확인하세요.' });
    }

    const result = await paymentService.verifyPayment(imp_uid, merchant_uid, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Payment verification error:', error.message);
    res.status(500).json({ success: false, message: error.message || '결제 검증 중 문제가 발생했습니다.' });
  }
};