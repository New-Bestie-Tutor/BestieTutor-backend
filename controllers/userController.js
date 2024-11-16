const userService = require('../services/userService');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

exports.kakaoLogin = (req, res) => {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const redirectUri = process.env.KAKAO_CALLBACK_URL;
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=account_email,profile_nickname&&prompt=login`;
    
    res.redirect(authUrl);
};

exports.kakaoCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ message: '인가 코드가 없습니다.' });
    }

    try {
        // userService의 kakaoLogin을 호출하여 JWT 토큰 받기
        const token = await userService.kakaoLogin(code);
        const user = await userService.getUserByToken(token); 

        // JWT 토큰을 쿠키에 설정
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // production 환경에서만 secure 옵션 활성화
            maxAge: 3600000, // 1시간 (3600초 * 1000 밀리초)
        });

        if (user.preferenceCompleted) {
            return res.redirect('http://localhost:5173/home');
        } else {
            return res.redirect('http://localhost:5173/chooseLanguage');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.register = async (req, res) => {
    const { email, password, nickname, phone, gender, address } = req.body;

    try {
        const newUser = await userService.register(email, password, nickname, phone, gender, address);
        res.status(201).json({ message: '회원가입 성공', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const token = await userService.login(email, password);
        const user = await userService.getUserByEmail(email);

        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 3600000 });

        const redirectUrl = user.preferenceCompleted
            ? '/home'
            : '/chooseLanguage';

        return res.status(200).json({ redirectUrl });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

exports.profile = async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const secret = process.env.JWT_SECRET; 

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            console.error("Token verification failed:", err);
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        res.json(decoded); 
    });
};


exports.logout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true });
    res.status(200).json({ success: true, message: '로그아웃 성공' });
};

exports.updateUser = async (req, res) => {
    const { email, password, nickname, phone, gender, address } = req.body;

    const updateFields = { nickname, phone, gender, address };
    if (password) {
        updateFields.password = password; // 비밀번호가 있을 경우 추가
    }

    try {
        const updatedUser = await userService.updateUser(email, updateFields);
        if (!updatedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '회원정보 수정 성공', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        await userService.resetPassword(email, newPassword);
        res.status(200).json({ message: '비밀번호 재설정 성공' });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { email } = req.body;

    try {
        await userService.deleteUser(email);
        res.status(200).json({ message: '회원 탈퇴 성공' });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: error.message });
    }
};

exports.userLanguage = (req, res) => {
    const { userId, language } = req.body;
    const result = userService.userLanguage(userId, language);
    res.status(200).json(result);
};

exports.userLevel = (req, res) => {
    const { userId, level } = req.body;
    const result = userService.userLevel(userId, level);
    res.status(200).json(result);
};

exports.userInterest = (req, res) => {
    const { userId, interests } = req.body;
    const result = userService.userInterest(userId, interests);
    res.status(200).json(result);
};

exports.getUser = async(req, res) => {
    const { userId } = req.query;

    try {
        const user = await userService.getUser(userId);

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.'});
        }
        
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 특정 사용자의 정보 반환
exports.getUserId = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(400).json({ message: '토큰이 없습니다.' });
    }

    try {
        const userId = await userService.getUserByToken(token); 
        res.status(201).json({ message: 'userId 조회 성공', userId: userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};