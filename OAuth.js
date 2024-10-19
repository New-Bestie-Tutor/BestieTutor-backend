const express = require('express');
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const app = express();

// Kakao Strategy
passport.use(new KakaoStrategy({
    clientID: 'KAKAO_CLIENT_ID',
    clientSecret: 'KAKAO_CLIENT_SECRET',
    callbackURL: 'http://localhost:3000/auth/kakao/callback'
}, (accessToken, refreshToken, profile, done) => {
    // 사용자 정보 처리 로직
    return done(null, profile);
}));


// OAuth 라우터 설정
app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback', passport.authenticate('kakao', {
    successRedirect: '/',
    failureRedirect: '/login'
}));


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
