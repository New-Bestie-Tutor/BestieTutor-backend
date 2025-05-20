const userService = require('../services/userService');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HOME_URL = '/home';
const LANGUAGE_URL = '/chooseLanguage';

exports.kakaoLogin = (req, res) => {
  const clientId = process.env.KAKAO_CLIENT_ID;
  const redirectUri = process.env.KAKAO_CALLBACK_URL;
  const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=account_email,profile_nickname&&prompt=login`;

  res.redirect(authUrl);
};

exports.kakaoCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "인가 코드가 없습니다." });
  }

  try {
    const { accessToken, refreshToken } = await userService.kakaoLogin(code);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 14 * 24 * 60 * 60 * 100, // 2주
    });

    const user = await userService.getUserByToken(accessToken);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json({
      accessToken: accessToken,
      user,
      redirectUrl: user.preferenceCompleted ? HOME_URL : LANGUAGE_URL,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is missing" });
  }

  try {
    const { accessToken } = await userService.refreshToken(refreshToken);
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: error.message });
  }
};

exports.register = async (req, res) => {
  const { email, password, nickname, phone, gender, address } = req.body;

  try {
    const newUser = await userService.register(
      email,
      password,
      nickname,
      phone,
      gender,
      address
    );
    res.status(201).json({ message: "회원가입 성공", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { accessToken, refreshToken } = await userService.login(
      email,
      password
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
    });

    const user = await userService.getUserByToken(accessToken);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json({
      accessToken: accessToken,
      user,
      redirectUrl: user.preferenceCompleted ? HOME_URL : LANGUAGE_URL,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: error.message });
  }
};

exports.profile = (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.status(200).json({
    userId: user.userId,
    email: user.email,
    message: "Profile fetched successfully",
  });
};

exports.logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true });
  res.status(200).json({ success: true, message: "로그아웃 성공" });
};

exports.updateUser = async (req, res) => {
  const { email, password, nickname, phone, gender, address } = req.body;

  const updateFields = { nickname, phone, gender, address };
  if (password) {
    updateFields.password = password; // 비밀번호가 있을 경우 추가
  }

  try {
    const updatedUser = await userService.updateUser(email, updateFields);
    if (!updatedUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.status(200).json({ message: "회원정보 수정 성공", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    await userService.resetPassword(email, newPassword);
    res.status(200).json({ message: "비밀번호 재설정 성공" });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { email } = req.body;

  try {
    await userService.deleteUser(email);
    res.status(200).json({ message: "회원 탈퇴 성공" });
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

exports.getUser = async (req, res) => {
  const { userId } = req.query;

  try {
    const user = await userService.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 특정 사용자의 정보 반환
exports.getUserInfo = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(400).json({ message: "토큰이 없습니다." });
  }

  try {
    const userInfo = await userService.getUserByToken(token);
    res.status(201).json({ message: "userId 조회 성공", userInfo: userInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 이메일 중복 확인
exports.checkEmailDuplicate = async (req, res) => {
  const { email } = req.body;
  try {
    const isDuplicate = await userService.checkEmailDuplicate(email);
    return res.status(201).json({ isDuplicate });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateTotalTime = async (req, res) => {
  const { userId, totalTime } = req.body;

  try {
    const updatedUser = await userService.updateTotalTime(userId, totalTime);
    return res.status(200).json({
      message: "총 사용 시간이 성공적으로 업데이트되었습니다.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating total_time:", error.message);
    return res.status(400).json({ message: error.message });
  }
};
