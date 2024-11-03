const userService = require('../services/userService');

exports.kakaoLogin = (req, res) => {
    const redirectUri = encodeURIComponent(process.env.KAKAO_CALLBACK_URL);
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=account_email,profile_nickname`;
    res.redirect(authUrl);
};

exports.kakaoCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ message: '인가 코드가 없습니다.' });
    }

    try {
        const user = await userService.kakaoLogin(code);
        res.redirect('http://localhost:5173/home');
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
        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 3600000 });
        res.status(200).json({ message: '로그인 성공', token });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true });
    res.status(200).json({ success: true, message: '로그아웃 성공' });
};

exports.updateUser = async (req, res) => {
    const { email } = req.body;

    try {
        const updatedUser = await userService.updateUser(email, req.body);
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
