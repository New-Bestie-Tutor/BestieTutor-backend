const paymentService = require('../services/paymentService');

exports.requestPayment = async (req, res) => {
  try {
    // 사용자 인증 확인
    if (!req.user) {
      console.error("Unauthorized: req.user is missing");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User information is missing.",
      });
    }

    const { userId, email, amount, paymentMethod } = req.body;

    // 요청 데이터 유효성 검사
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "필수 요청 데이터를 확인하세요. (amount, paymentMethod)",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "결제 금액은 0보다 커야 합니다.",
      });
    }

    const validPaymentMethods = ["card", "transfer", "kakaopay", "naverpay", "tosspay"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "결제 수단이 유효하지 않습니다.",
      });
    }

    // 결제 요청 생성
    const response = await paymentService.createPaymentRequest(
      userId,
      email,
      amount,
      paymentMethod
    );

    return res.status(200).json({
      success: true,
      status: "결제 요청 성공",
      data: response,
    });
  } catch (error) {
    console.error("결제 요청 중 에러 발생:", error.message);
    return res.status(500).json({
      success: false,
      message: "결제 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { imp_uid, merchant_uid } = req.body;
    const userId = req.user?.id;

    if (!userId || !imp_uid || !merchant_uid) {
      return res.status(400).json({
        success: false,
        message: "필수 요청 데이터를 확인하세요. (userId, imp_uid, merchant_uid)",
      });
    }

    // 결제 검증
    const result = await paymentService.verifyPayment(
      imp_uid,
      merchant_uid,
      userId
    );

    return res.status(200).json({
      success: true,
      status: "결제 검증 성공",
      data: result,
    });
  } catch (error) {
    console.error("결제 검증 중 에러 발생:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "결제 검증 중 문제가 발생했습니다. 다시 시도해주세요.",
    });
  }
};