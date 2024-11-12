const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

exports.kakaoLogin = async (code) => {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const redirectUri = process.env.KAKAO_CALLBACK_URL;

    try {
        const tokenResponse = await axios.post(
            `https://kauth.kakao.com/oauth/token`, 
            null, 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                params: {
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    code,
                },
            }
        );

        // Access Token 추출 및 사용자 정보 요청
        const accessToken = tokenResponse.data.access_token;
        const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const kakaoUser = userInfoResponse.data;

        // 사용자 정보를 DB에 저장 또는 업데이트
        const lastUser = await User.findOne().sort({ userId: -1 });
        const newUserId = lastUser ? lastUser.userId + 1 : 0;

        const user = await User.findOneAndUpdate(
            { kakaoId: kakaoUser.id }, // Kakao 고유 ID로 검색
            {
                $setOnInsert: {
                    userId: newUserId, // 새로운 userId 설정
                    password: 'kakao-login', // 기본값
                    phone: '', // 기본값
                    address: '', // 기본값
                },
                kakaoId: kakaoUser.id,
                email: kakaoUser.kakao_account.email || '',
                nickname: kakaoUser.properties.nickname || 'Anonymous',
                gender: kakaoUser.kakao_account.gender || 'hidden',
            },
            { new: true, upsert: true } // 업데이트 또는 생성
        );

        // JWT 토큰 생성
        const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1시간 유효
        const payload = {
            userId: user.userId,
            email: user.email,
            exp: expirationTime,
        };
        const token = jwt.sign(payload, jwtSecret);

        return token; // 생성된 JWT 토큰 반환
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
    const newUser = new User({ userId, email, password: hashedPassword, nickname, 
        phone, gender, address, kakaoId: userId.toString() });
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
            kakaoId: user.kakaoId,
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

    // 비밀번호 업데이트가 있을 경우 해시 처리
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

// 특정 사용자 정보 조회
exports.getUser = async(userId) => {
    try {
        const user = await User.findOne({ userId: userId });
        return user;
    } catch (error) {
        throw new Error('사용자 정보를 가져오는 데 실패했습니다.');
    }
};

exports.getUserByToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ userId: decoded.userId });
        return user;
    } catch (error) {
        throw new Error('토큰으로 사용자 정보를 조회하는 데 실패했습니다.');
    }
};

exports.getUserByEmail = async (email) => {
    try {
        const user = await User.findOne({ email });
        return user;
    } catch (error) {
        throw new Error('사용자 정보를 가져오는 데 실패했습니다.');
    }
};