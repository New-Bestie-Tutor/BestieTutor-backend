const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// 라우트 임포트
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const characterRoutes = require('./routes/characterRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const topicRoutes = require('./routes/topicRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const port = 3000;

// CORS 설정
app.use(cors({
    origin: 'http://localhost:5173', // 프론트엔드의 포트 번호
    credentials: true, // 쿠키, 인증 헤더 등을 포함한 요청을 허용
}));

app.use(express.json());
app.use(cookieParser());

// 기본 라우트
app.get('/', (req, res) => {
    res.send('베스티 튜터 백엔드 서버가 실행 중입니다!');
});

// 사용자 관련 라우트
app.use('/user', userRoutes);

// 회화 관련 라우트
app.use('/conversation', conversationRoutes);

// 캐릭터 관련 라우트
app.use('/character', characterRoutes);

// 공지사항 관련 라우트
app.use('/notice', noticeRoutes);

// 이벤트 관련 라우트
app.use('/event', eventRoutes);

// 주제 관련 라우트
app.use('/topic', topicRoutes);

// 관리자 관련 라우트
app.use('/admin', adminRoutes);

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});