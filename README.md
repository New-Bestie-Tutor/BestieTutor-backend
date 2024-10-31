# 🐾 베스티 튜터 백엔드 서버 🐾

안녕하세요! 베스티 튜터 백엔드 서버에 오신 것을 환영합니다! 이 서버는 사용자 관리, 공지사항 및 이벤트 관리를 위한 API를 제공합니다.

## 🚀 기능

- **카카오 로그인**: 카카오를 통한 사용자 인증
- **회원 관리**: 회원가입, 로그인, 정보 수정 및 탈퇴
- **공지사항 관리**: 공지사항 추가, 수정, 삭제 및 조회
- **이벤트 관리**: 이벤트 추가, 수정, 삭제 및 조회
- **사용자 설정**: 언어, 학습 레벨, 관심 주제 설정

## 📦 설정 방법

### 1. 프로젝트 클론
레포지토리를 클론합니다.
```bash
git clone https://github.com/Bestie-Tutor/BestieTutor-backend.git
cd BestieTutor-backend
```

### 2. .env 파일 준비
루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 추가하세요.
```
KAKAO_CLIENT_ID={Your Kakao client ID}
KAKAO_CALLBACK_URL={Your Kakao callback URL}
```

### 3. Node.js 패키지 설치
필요한 패키지를 설치합니다.
```bash
npm install express cors axios dotenv jsonwebtoken bcryptjs mongoose cookie-parser
npm install --save-dev nodemon
```

### 4. 서버 실행
서버를 실행합니다.
```bash
nodemon index.js
```

## 🎉 기여하기
기여하고 싶으신가요? 언제든지 PR을 보내주세요! 
