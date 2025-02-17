const express = require("express");
const router = express.Router();
const mafiaController = require("../controllers/mafiaController");

// 게임 설정 저장
router.post("/setup", mafiaController.setupGame);

// 현재 게임 상태 조회
router.get("/state", mafiaController.getGameState);

module.exports = router;