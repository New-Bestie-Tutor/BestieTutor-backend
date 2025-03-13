const mafiaService = require("../services/mafiaService");

exports.setupGame = async (req, res) => {
  try {
    const { mafiaCount, roles, players } = req.body;
    const game = await mafiaService.setupGame(mafiaCount, roles, players);
    res.status(201).json({ message: "게임 설정 완료", gameId: game._id });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.getGameState = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await mafiaService.getGameState(gameId);
    if (!game) return res.status(404).json({ message: "게임을 찾을 수 없음" });
    console.log("백엔드에서 찾은 게임 데이터:", game);
    console.log("백엔드에서 보내는 players 데이터:", game.players);

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.vote = async (req, res) => {
  try {
    const { gameId, selectedPlayer } = req.body;

    // 🔍 요청 데이터 확인
    console.log("🔹 Received vote request:", { gameId, selectedPlayer });

    if (!gameId || !selectedPlayer) {
      return res.status(400).json({ success: false, message: "gameId 또는 selectedPlayer가 없습니다." });
    }

    const result = await mafiaService.vote(gameId, selectedPlayer);
    res.json({ success: true, message: result });
  } catch (error) {
    console.error("❌ Vote error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.decision = async (req, res) => {
  try {
    const { gameId, decision } = req.body;
    console.log(`📩 API 요청 수신: decision=${decision}, gameId=${gameId}`);
    const result = await mafiaService.decision(gameId, decision);
    res.json({ success: true, message: result });
  } catch (error) {
    console.error('🚨 투표 처리 중 오류 발생:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};