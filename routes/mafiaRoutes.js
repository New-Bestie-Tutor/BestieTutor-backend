const express = require("express");
const router = express.Router();
const mafiaController = require("../controllers/mafiaController");

// 게임 설정 저장
router.post("/game/setup", mafiaController.setupGame);

// 특정 게임 상태 조회
router.get("/game/:gameId", mafiaController.getGameState);

// 낮/밤 변경
router.post("/game/nextPhase", mafiaController.nextPhase);

// 투표
router.post("/game/vote", mafiaController.vote);

// 최종 결정
router.post("/game/decision", mafiaController.decision);

// 밤 행동
router.post("/game/mafia", mafiaController.mafiaAction);

router.post("/game/police", mafiaController.policeAction);

router.post("/game/doctor", mafiaController.doctorAction);

router.post("/game/process", mafiaController.processNightActions);

// AI 행동
router.post("/game/aiNarration", mafiaController.aiNarration);

router.post("/game/playerResponse", mafiaController.playerResponse);

module.exports = router;