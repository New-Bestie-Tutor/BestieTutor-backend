const axios = require('axios');
const Payment = require('../models/Payment');

const { IMP_KEY, IMP_SECRET, NODE_ENV } = process.env;

// 포트원 액세스 토큰 생성
const getAccessToken = async () => {
  try {
    const payload = {
      imp_key: IMP_KEY,
      imp_secret: IMP_SECRET,
    };
    
    const response = await axios.post('https://api.iamport.kr/users/getToken', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data.code !== 0) {
      throw new Error(`포트원 토큰 요청 실패: ${response.data.message}`);
    }

    return response.data.response.access_token;
  } catch (error) {
    console.error('AccessToken 생성 중 오류:', error.message);
    throw new Error('포트원 토큰 생성에 실패했습니다.');
  }
};

// 결제 요청 생성
exports.createPaymentRequest = async (userId, email, amount, paymentMethod) => {
  try {
    const merchantUid = `${NODE_ENV === 'development' ? 'dev_' : ''}order_${Date.now()}`;

    // 결제 정보 저장 (pending 상태)
    const payment = new Payment({
      userId,
      impUid: null, // 결제 후 업데이트됨
      merchantUid,
      amount,
      paymentMethod,
      status: 'pending',
    });

    await payment.save();

    // 액세스 토큰 생성
    const token = await getAccessToken();
    console.log('Access Token:', token); // 액세스 토큰 로그 추가

    // 포트원 API에 사전 결제 등록 요청
    const response = await axios.post(
      'https://api.iamport.kr/payments/prepare',
      {
        merchant_uid: merchantUid,
        amount,
      },
      { headers: { Authorization: token } }
    );

    if (response.data.code !== 0) {
      throw new Error(`PG 준비 상태 오류: ${response.data.message}`);
    }

    return {
      merchantUid,
      amount,
      buyer_email: email,
      environment: NODE_ENV === 'development' ? '테스트 환경' : '라이브 환경',
    };
  } catch (error) {
    console.error('결제 요청 생성 중 오류:', error.message);
    throw new Error('결제 요청 생성에 실패했습니다.');
  }
};

// 결제 검증
exports.verifyPayment = async (impUid, merchantUid, userId) => {
  try {
    const accessToken = await getAccessToken();
    console.log('Access Token:', accessToken);

    const response = await axios.get(`https://api.iamport.kr/payments/${impUid}`, {
      headers: { Authorization: accessToken },
    });

    console.log('결제 검증 응답:', response.data);

    if (response.data.code !== 0) {
      throw new Error(`결제 검증 실패: ${response.data.message}`);
    }

    const paymentData = response.data.response;

    // 결제 금액 및 merchantUid 검증
    if (paymentData.merchant_uid !== merchantUid) {
      throw new Error('Merchant UID가 일치하지 않습니다.');
    }

    // 결제 상태 확인 및 업데이트
    const payment = await Payment.findOne({ merchantUid, userId });
    if (!payment) {
      throw new Error('해당 결제 기록을 찾을 수 없습니다.');
    }

    if (paymentData.status === 'paid') {
      payment.status = 'success';
      payment.impUid = impUid;
      await payment.save();
      return {
        message: '결제 검증 완료',
        payment,
        environment: NODE_ENV === 'development' ? '테스트 환경' : '라이브 환경',
      };
    } else {
      throw new Error('결제 검증에 실패했습니다.');
    }
  } catch (error) {
    console.error('결제 검증 중 오류:', error.message);
    throw new Error('결제 검증 처리에 실패했습니다.');
  }
};