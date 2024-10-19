const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('베스티 튜터 백엔드 서버가 실행 중입니다!');
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});

let users = []; // 임시 사용자 저장소

app.post('/user', (req, res) => {
    const { userId, password, nickname, phone, email, gender, address } = req.body;

    // 필수 입력값 확인
    if (!userId || !password || !nickname || !email) {
        return res.status(400).json({ message: '필수 입력값이 누락되었습니다.' });
    }

    // 이미 존재하는 사용자 확인
    const existingUser = users.find(user => user.userId === userId);
    if (existingUser) {
        return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
    }

    // 새 사용자 추가
    const newUser = { userId, password, nickname, phone, email, gender, address };
    users.push(newUser);

    res.status(201).json({ message: '회원가입 성공' });
});

app.post('/user/login', (req, res) => {
    const { userId, password } = req.body;

    // 필수 입력값 확인
    if (!userId || !password) {
        return res.status(400).json({ message: '아이디 또는 비밀번호를 입력하세요.' });
    }

    // 사용자 인증
    const user = users.find(u => u.userId === userId && u.password === password);
    if (!user) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    res.status(200).json({ message: '로그인 성공' });
});

// POST /user/language
app.post('/user/language', (req, res) => {
    const { userId, language } = req.body;
    res.status(200).json({ message: '언어 설정 업데이트 완료' });
});

// POST /user/level
app.post('/user/level', (req, res) => {
    const { userId, level } = req.body;
    res.status(200).json({ message: '학습 레벨 업데이트 완료' });
});

// POST /user/interests
app.post('/user/interests', (req, res) => {
    const { userId, interests } = req.body;
    res.status(200).json({ message: '관심 주제 업데이트 완료' });
});