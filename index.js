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
let loginAttempts = {}; // 로그인 시도 간격 확인



// 회원가입
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



// 로그인
app.post('/user/login', (req, res) => {
    const { userId, password } = req.body;
    const currentTime = Date.now();

    // 필수 입력값 확인
    if (!userId || !password) {
        return res.status(400).json({ message: '아이디 또는 비밀번호를 입력하세요.' });
    }

    // 사용자별 로그인 시도 시간 확인
    if (loginAttempts[userId] && currentTime - loginAttempts[userId] < 1000) {
        return res.status(429).json({ message: '로그인 시도가 너무 빠릅니다. 1초 후 다시 시도하세요.' });
    }

    // 로그인 시도 시간 업데이트
    loginAttempts[userId] = currentTime;

    // 사용자 인증
    const user = users.find(u => u.userId === userId && u.password === password);
    if (!user) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    res.status(200).json({ message: '로그인 성공' });
});



// 아이디 찾기
app.post('/user/searchID', (req, res) => {
    const { email } = req.body;

    // 필수 입력값 확인
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력하세요.' });
    }

    // 이메일로 사용자 찾기
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: '해당 이메일을 가진 사용자가 없습니다.' });
    }

    // 아이디 반환
    res.status(200).json({ userId: user.userId });
});



//회원 정보 수정
app.put('/user', (req, res) => {
    const { userId, password, nickname, phone, email, gender, address } = req.body;

    // 필수 입력값 확인
    if (!userId) {
        return res.status(400).json({ message: '사용자 아이디를 입력하세요.' });
    }

    // 사용자 검색
    const user = users.find(u => u.userId === userId);
    if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 정보 수정
    if (password) user.password = password;
    if (nickname) user.nickname = nickname;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (address) user.address = address;

    res.status(200).json({ message: '회원정보 수정 성공', user });
});



// 비밀번호 재설정
app.post('/user/resetPass', (req, res) => {
    const { email, newPassword } = req.body;

    // 필수 입력값 확인
    if (!email || !newPassword) {
        return res.status(400).json({ message: '이메일과 새 비밀번호를 입력하세요.' });
    }

    // 이메일로 사용자 찾기
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: '해당 이메일을 가진 사용자가 없습니다.' });
    }

    // 비밀번호 재설정
    user.password = newPassword;

    res.status(200).json({ message: '비밀번호 재설정 성공' });
});



// 회원 탈퇴
app.delete('/user', (req, res) => {
    const { userId } = req.body;

    // 필수 입력값 확인
    if (!userId) {
        return res.status(400).json({ message: '사용자 아이디를 입력하세요.' });
    }

    // 사용자 검색
    const userIndex = users.findIndex(u => u.userId === userId);
    if (userIndex === -1) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 삭제
    users.splice(userIndex, 1);

    res.status(200).json({ message: '회원 탈퇴 성공' });
});



let notice = []; // 임시 공지사항 저장소



// 공지사항 추가
app.post('/notice', (req, res) => {
    const { title, content } = req.body;

    // 필수 입력값 확인
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
    }

    // 새로운 공지사항 ID 동적 생성
    const newNoticeId = notice.length > 0 ? notice[notice.length - 1].noticeId + 1 : 1;


    const newNotice = {
        noticeId: newNoticeId,
        title: title,
        content: content,
        inputDate: new Date().toISOString(),
        updateDate: new Date().toISOString()
    };

    // 공지사항 배열에 추가
    notice.push(newNotice);

    res.status(201).json({ status: 'success', data: newNotice });
});



// 공지사항 수정
app.put('/notice/:noticeId', (req, res) => {
    const { noticeId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    const noticeIndex = notice.findIndex(n => n.noticeId === parseInt(noticeId));
    if (noticeIndex === -1) {
        return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
    }

    notice[noticeIndex] = {
        ...notice[noticeIndex],
        title,
        content,
        updateDate: new Date().toISOString().split('T')[0]
    };

    res.status(200).json({ status: 'success', data: notice[noticeIndex] });
});



// 공지사항 삭제
app.delete('/notice/:noticeId', (req, res) => {
    const { noticeId } = req.params;

    const noticeIndex = notice.findIndex(n => n.noticeId === parseInt(noticeId));
    if (noticeIndex === -1) {
        return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
    }

    notice.splice(noticeIndex, 1);
    res.status(200).json({ status: 'success', message: '삭제 완료' });
});



// 공지사항 조회
app.get('/notice', (req, res) => {
    res.status(200).json({ status: 'success', data: notice });
});



// 특정 공지사항 조회
app.get('/notice/:noticeId', (req, res) => {
    const noticeId = parseInt(req.params.noticeId);

    const FoundNotice = notice.find(n => n.noticeId === noticeId);//조회된 공지사항이므로 notice 말고 FoundNotice로 새로 정의해야 됨

    if (!FoundNotice) {
        return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
    }

    res.status(200).json({ status: 'success', data: FoundNotice });
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