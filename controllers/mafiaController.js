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