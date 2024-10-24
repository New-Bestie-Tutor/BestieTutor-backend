### Besite Tutor

Bestie Tutor 애플리케이션의 백엔드 소스 코드입니다.

### Member
최수연 : 팀장, 프론트엔드<br>
김은아 : 팀원, 프론트엔드<br>
서가은 : 팀원, 백엔드<br>
허준우 : 팀원, 백엔드<br>
멘토 : 나동빈<br>
청년취업사관학교 금천4기 웹 풀스택 개발자 양성 나동빈강사 과정

#### How to Install

<pre>
git clone https://github.com/Bestie-Tutor/BestieTutor-backend.git
cd backend
cd BestieTutor-backend
npm install -g nodemon
npm install express
nodemon index.js
</pre>

#### Structure

* 
* 

#### Postman test

URL: http://localhost:3000


Post /user
{
  "userId": "testuser",
  "password": "password123",
  "nickname": "Tester",
  "phone": "010-0000-0000",
  "email": "testuser@gmail.com",
  "gender": "male",
  "address": "Seoul"
}


Post /user/login
{
  "userId": "testuser",
  "password": "password123"
}


POST /user/searchID
{
  "email": "testuser@gmail.com"
}


Put /user
{
    "userId": "testuser",
    "nickname": "newNickname",
    "email": "newemail@gmail.com",
    "phone": "010-1234-5678",
    "address": "newAddress"
}


POST /user/resetPass
{
  "email": "newemail@gmail.com", 
  "newPassword": "newpassword456"
}


Delete /user
{
    "userId": "testuser"
}


POST /notice
{ 
  "title": "새 공지사항 제목",
  "content": "새 공지사항 내용" 
}


PUT /notice/:noticeId(/notice/1)
{ 
  "title": "수정된 공지사항 제목",
  "content": "수정된 공지사항 내용" 
}


DELETE /notice/:noticeId(/notice/1)
{

}


GET /notice 
{

}

GET /notice/:noticeId(/notice/1)
{

}