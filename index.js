const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Inquiry = require('./models/Inquiry');
const Notice = require('./models/Notice');
const bcrypt = require('bcryptjs');
const conversationRoutes = require('./routes/conversationRoutes');


dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


const app = express();
const port = 3000;

// CORS 설정
app.use(cors({
    origin: 'http://localhost:5173', // 프론트엔드의 포트 번호
    credentials: true, // 쿠키, 인증 헤더 등을 포함한 요청을 허용
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('베스티 튜터 백엔드 서버가 실행 중입니다!');
});

// 카카오 로그인 라우트
app.get('/user/login/kakao', (req, res) => {
    const redirectUri = encodeURIComponent(process.env.KAKAO_CALLBACK_URL);
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
    res.redirect(authUrl);
});

// 카카오 콜백 라우트
app.get('/user/login/kakao/callback', async (req, res) => {
    const { code } = req.query;

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

        // 사용자 정보 가져오기
        const userResponse = await axios.get(`https://kapi.kakao.com/v2/user/me`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userData = userResponse.data;

        // 사용자 정보 처리 (예: 데이터베이스에 저장)
        console.log(userData);

        res.status(200).json({ message: '로그인 성공', user: userData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '로그인 실패' });
    }
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});



let loginAttempts = {}; // 로그인 시도 간격 확인

// 회원가입
app.post('/user', async (req, res) => {
    const { email, password, nickname, phone, gender, address } = req.body;

    // 필수 입력값 확인
    if (!email || !password || !nickname) {
        return res.status(400).json({ message: '필수 입력값이 누락되었습니다.' });
    }

    try {
        // 이미 존재하는 사용자 확인
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
        }

        // 마지막 유저의 userId + 1로 userId 생성
        const lastUser = await User.findOne().sort({ userId: -1 });
        const userId = lastUser ? lastUser.userId + 1 : 0;

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, bcryptSalt);

        // 새 사용자 추가
        const newUser = new User({ userId, email, password: hashedPassword, nickname, phone, gender, address });
        await newUser.save();

        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});



// 로그인
app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;
    const currentTime = Date.now();

    if (!email || !password) {
        return res.status(400).json({ message: '이메일 또는 비밀번호를 입력하세요.' });
    }

    // 로그인 시도 시간 확인
    if (loginAttempts[email] && currentTime - loginAttempts[email] < 1000) {
        return res.status(429).json({ message: '로그인 시도가 너무 빠릅니다. 1초 후 다시 시도하세요.' });
    }

    // 로그인 시도 시간 업데이트
    loginAttempts[email] = currentTime;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
        }

        // 비밀번호 검증
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
        }

        // JWT 토큰 발급
        const token = jwt.sign({ userId: user.userId, email: user.email }, jwtSecret, { expiresIn: '1h' });

        // 쿠키에 토큰 저장
        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 3600000 });

        res.status(200).json({ message: '로그인 성공', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// 로그아웃
app.post('/user/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true });
    res.status(200).json({ success: true, message: '로그아웃 성공' });
});


// 회원 정보 수정
app.put('/user', async (req, res) => {
    const { email, password, nickname, phone, gender, address } = req.body;

    // 필수 입력값 확인
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력하세요.' });
    }

    try {
        // 이메일로 사용자 찾기
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 사용자 정보 수정
        if (password) user.password = await bcrypt.hash(password, bcryptSalt);
        if (nickname) user.nickname = nickname;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;
        if (address) user.address = address;

        await user.save(); // 변경 사항 저장
        res.status(200).json({ message: '회원정보 수정 성공', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '회원정보 수정 중 오류가 발생했습니다.' });
    }
});


// 비밀번호 재설정
app.post('/user/resetPass', async (req, res) => {
    const { email, newPassword } = req.body;

    // 필수 입력값 확인
    if (!email || !newPassword) {
        return res.status(400).json({ message: '이메일과 새 비밀번호를 입력하세요.' });
    }

    try {
        // 이메일로 사용자 찾기
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: '해당 이메일을 가진 사용자가 없습니다.' });
        }

        // 비밀번호 재설정
        user.password = await bcrypt.hash(newPassword, bcryptSalt);
        await user.save();

        res.status(200).json({ message: '비밀번호 재설정 성공' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '비밀번호 재설정 중 오류가 발생했습니다.' });
    }
});


// 회원 탈퇴
app.delete('/user', async (req, res) => {
    const { email } = req.body;

    // 필수 입력값 확인
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력하세요.' });
    }

    try {
        // 이메일로 사용자 찾기 및 삭제
        const user = await User.findOneAndDelete({ email });
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '회원 탈퇴 성공' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '회원 탈퇴 중 오류가 발생했습니다.' });
    }
});



// 공지사항 추가
app.post('/notice', async (req, res) => {
    const { title, content } = req.body;

    // 필수 입력값 확인
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
    }

    try {
        const newNotice = new Notice({
            title,
            content,
            inputDate: new Date(),
            updateDate: new Date(),
        });
        await newNotice.save();

        res.status(201).json({ status: 'success', data: newNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 추가 중 오류가 발생했습니다.' });
    }
});



// 공지사항 수정
app.put('/notice/:noticeId', async (req, res) => {
    const { noticeId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    try {
        const updatedNotice = await Notice.findByIdAndUpdate(
            noticeId,
            { title, content, updateDate: new Date() },
            { new: true }
        );

        if (!updatedNotice) {
            return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', data: updatedNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 수정 중 오류가 발생했습니다.' });
    }
});



// 공지사항 삭제
app.delete('/notice/:noticeId', async (req, res) => {
    const { noticeId } = req.params;

    try {
        const deletedNotice = await Notice.findByIdAndDelete(noticeId);

        if (!deletedNotice) {
            return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', message: '삭제 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 삭제 중 오류가 발생했습니다.' });
    }
});



// 공지사항 조회
app.get('/notice', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ inputDate: -1 }); // 최신순 정렬
        res.status(200).json({ status: 'success', data: notices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
    }
});



// 특정 공지사항 조회
app.get('/notice/:noticeId', async (req, res) => {
    const { noticeId } = req.params;

    try {
        const foundNotice = await Notice.findById(noticeId);

        if (!foundNotice) {
            return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', data: foundNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
    }
});



// 이벤트 추가
app.post('/events', async (req, res) => {
    const { title, content } = req.body;

    // 필수 입력값 확인
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
    }

    try {
        const newEvent = new Event({
            title,
            content,
            inputDate: new Date(),
            updateDate: new Date(),
        });
        await newEvent.save();

        res.status(201).json({ status: 'success', data: newEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 추가 중 오류가 발생했습니다.' });
    }
});



// 이벤트 수정
app.put('/events/:eventsId', async (req, res) => {
    const { eventsId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            eventsId,
            { title, content, updateDate: new Date() },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', data: updatedEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 수정 중 오류가 발생했습니다.' });
    }
});



// 이벤트 삭제
app.delete('/events/:eventsId', async (req, res) => {
    const { eventsId } = req.params;

    try {
        const deletedEvent = await Notice.findByIdAndDelete(eventsId);

        if (!deletedEvent) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', message: '삭제 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 삭제 중 오류가 발생했습니다.' });
    }
});



// 이벤트 조회
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ inputDate: -1 }); // 최신순 정렬
        res.status(200).json({ status: 'success', data: events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 조회 중 오류가 발생했습니다.' });
    }
});


// 언어 설정
app.post('/user/language', (req, res) => {
    const { userId, language } = req.body;
    res.status(200).json({ message: '언어 설정 업데이트 완료' });
});



// 학습 레벨 설정
app.post('/user/level', (req, res) => {
    const { userId, level } = req.body;
    res.status(200).json({ message: '학습 레벨 업데이트 완료' });
});



// 관심 주제 설정
app.post('/user/interests', (req, res) => {
    const { userId, interests } = req.body;
    res.status(200).json({ message: '관심 주제 업데이트 완료' });
});

app.use('/conversation', conversationRoutes);