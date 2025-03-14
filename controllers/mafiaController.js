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

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.vote = async (req, res) => {
  try {
    const { gameId, selectedPlayer } = req.body;

    // 요청 데이터 확인
    console.log("Received vote request:", { gameId, selectedPlayer });

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