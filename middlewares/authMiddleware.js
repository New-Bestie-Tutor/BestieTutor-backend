const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // 쿠키에서 토큰을 가져옴

    if (!token) {
        return res.status(401).json({ message: '토큰이 없습니다' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: '토큰 인증 실패' });
        }
        
        req.user = decoded; // 유저 정보를 req.user에 할당
        req.user.settings = req.user.settings || {}; // settings 없을 때 초기화
        next();
    });
};

module.exports = authMiddleware;