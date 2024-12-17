const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true },
    preferenceCompleted: { type: Boolean, defaut: false },
    phone: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    kakaoId: { type: String, unique: true }, // 카카오 아이디 필드 추가
    total_time: { type: Number, default: 0 },
    quit: { type: Boolean, default: false },
    delete_date: { type: Date, default: null },
}, {timestamps: true});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;