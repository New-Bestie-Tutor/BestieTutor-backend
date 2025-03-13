const express = require("express");
const router = express.Router();
const mafiaController = require("../controllers/mafiaController");

// 게임 설정 저장
router.post("/game/setup", mafiaController.setupGame);

// 특정 게임 상태 조회
router.get("/game/:gameId", mafiaController.getGameState);

// 투표
router.post("/game/vote", mafiaController.vote);

// 최종 결정
router.post("/game/decision", mafiaController.decision);

module.exports = router;