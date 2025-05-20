const mafiaService = require("../services/mafiaService");
const MafiaConversation = require("../models/MafiaConversation");
const MafiaMessage = require("../models/MafiaMessage");
const Mafia = require("../models/Mafia");

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

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.nextPhase = async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await mafiaService.nextPhase(gameId);

    res.json({
      message: "다음 단계로 진행됨",
      status: game.phase,
      history: game.history,
      players: game.players,
      gameOver: game.gameOver,
      winner: game.winner,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.vote = async (req, res) => {
  try {
    const { gameId, selectedPlayer } = req.body;

    if (!gameId || !selectedPlayer) {
      return res.status(400).json({ success: false, message: "gameId 또는 selectedPlayer가 없습니다." });
    }

    const result = await mafiaService.vote(gameId, selectedPlayer);
    res.json({ success: true, message: result });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.decision = async (req, res) => {
  try {
    const { gameId, decision } = req.body;
    const result = await mafiaService.decision(gameId, decision);
    res.json({ success: true, message: result });
  } catch (error) {
    console.error('투표 처리 중 오류 발생:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.mafiaAction = async (req, res) => {
  const { gameId, mafiaTarget } = req.body;
  try {
    await mafiaService.mafiaAction(gameId, mafiaTarget);
    res.json({ message: `${mafiaTarget}을(를) 공격 대상으로 설정했습니다.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.policeAction = async (req, res) => {
  const { gameId, policeTarget } = req.body;
  try {
    const role = await mafiaService.policeAction(gameId, policeTarget);
    res.json({ message: `경찰이 ${policeTarget}을 조사한 결과: ${role}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.doctorAction = async (req, res) => {
  const { gameId, doctorTarget } = req.body;
  try {
    await mafiaService.doctorAction(gameId, doctorTarget);
    res.json({ message: `${doctorTarget}을(를) 보호 대상으로 설정했습니다.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processNightActions = async (req, res) => {
  const { gameId } = req.body;
  try {
    const result = await mafiaService.processNightActions(gameId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 AI가 현재 게임 상황을 설명하는 함수
exports.aiNarration = async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Mafia.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "게임을 찾을 수 없음" });
    }
    const narration = await mafiaService.aiNarration(game);
    res.json({ message: narration });
  } catch (error) {
    console.error(`[aiNarration] 서버 오류:`, error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 🔹 플레이어의 응답을 분석하고 반응하는 함수
exports.playerResponse = async (req, res) => {
  try {
    const { gameId, playerMessage } = req.body;
    const game = await mafiaService.getGameState(gameId);
    if (!game) {
      console.warn(`[playerResponse] 게임을 찾을 수 없음: ${gameId}`);
      return res.status(404).json({ message: "게임을 찾을 수 없음" });
    }

    const aiResponse = await mafiaService.playerResponse(game, playerMessage);

    res.json({ message: aiResponse });
  } catch (error) {
    console.error(`[playerResponse] 서버 오류:`, error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};