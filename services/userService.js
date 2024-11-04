const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

exports.kakaoLogin = async (code) => {
    try {
        const tokenResponse = await axios.post(`https://kauth.kakao.com/oauth/token`, null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: process.env.KAKAO_CALLBACK_URL,
                code,
            },
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get(`https://kapi.kakao.com/v2/user/me`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userData = userResponse.data;
        const kakaoId = userData.id;
        const email = userData.account_email; 
        const nickname = userData.profile_nickname;

        // 사용자 정보 저장 또는 업데이트
        return await User.findOneAndUpdate(
            { kakaoId: kakaoId },
            { email: email, nickname: nickname },
            { upsert: true, new: true }
        );

    } catch (error) {
        console.error(error);
        throw new Error('카카오 로그인 실패');
    }
};

exports.register = async (email, password, nickname, phone, gender, address) => {
    // 이미 존재하는 사용자 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('이미 존재하는 사용자입니다.');
    }

    // 마지막 유저의 userId + 1로 userId 생성
    const lastUser = await User.findOne().sort({ userId: -1 });
    const userId = lastUser ? lastUser.userId + 1 : 0;

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, bcryptSalt);

    // 새 사용자 추가
    const newUser = new User({ userId, email, password: hashedPassword, nickname, phone, gender, address });
    await newUser.save();
    return newUser;
};

exports.login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
            throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    try {
        // JWT 토큰 발급
        const expirationTime = Math.floor(Date.now() / 1000) + 60*60; 
        const payload = {
            userId: user.userId,
            email: user.email,
            exp: expirationTime,
        };
        const token = jwt.sign(payload, jwtSecret);
        return token;
    } catch (error) {
        console.error('JWT 토큰 생성 오류: ', error);
        throw new Error('토큰 생성에 실패했습니다.');
    }
};

exports.updateUser = async (email, updates) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 사용자 정보 수정
    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, bcryptSalt);
    }

    Object.assign(user, updates);
    await user.save();
    return user;
};

exports.resetPassword = async (email, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('해당 이메일을 가진 사용자가 없습니다.');
    }

    user.password = await bcrypt.hash(newPassword, bcryptSalt);
    await user.save();
};

exports.deleteUser = async (email) => {
    const user = await User.findOneAndDelete({ email });
    if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
    }
};

// 언어 설정
exports.userLanguage = (userId, language) => {
    // 언어 설정 로직 구현
    return { message: '언어 설정 업데이트 완료' };
};

// 학습 레벨 설정
exports.userLevel = (userId, level) => {
    // 학습 레벨 설정 로직 구현
    return { message: '학습 레벨 업데이트 완료' };
};

// 관심 주제 설정
exports.userInterest = (userId, interests) => {
    // 관심 주제 설정 로직 구현
    return { message: '관심 주제 업데이트 완료' };
};
