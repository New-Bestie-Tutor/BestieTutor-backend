const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 회원가입
router.post('/', userController.register);

// 로그인
router.post('/login', userController.login);

// 카카오 로그인 요청
router.get('/login/kakao', userController.kakaoLogin);

// 카카오 로그인 콜백
router.get('/login/kakao/callback', userController.kakaoCallback);

// 로그아웃
router.post('/logout', userController.logout);

// 회원 정보 수정
router.put('/', userController.updateUser);

// 비밀번호 재설정
router.post('/resetPass', userController.resetPassword);

// 회원 탈퇴
router.delete('/', userController.deleteUser);

// 언어 설정
router.post('/language', userController.userLanguage);

// 학습 레벨 설정
router.post('/level', userController.userLevel);

// 관심 주제 설정
router.post('/interests', userController.userInterest);

// 사용자 정보 조회
router.get('/getUser', userController.getUser);

module.exports = router;