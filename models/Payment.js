const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  impUid: { type: String, default: null }, // 포트원 결제 고유번호
  merchantUid: { type: String, required: true }, // 주문 고유번호
  amount: { type: Number, required: true }, // 결제 금액
  paymentMethod: { type: String, required: true }, // 결제 수단 (kakaopay, tosspay 등)
  status: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed'] }, // 결제 상태
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);