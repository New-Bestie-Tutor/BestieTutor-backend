const mafiaService = require("../services/mafiaService");

exports.setupGame = async (req, res) => {
  try {
    const { mafiaCount, roles, players } = req.body;
    const game = await mafiaService.createGame(mafiaCount, roles, players);
    res.status(201).json({ message: "게임 설정 완료", gameId: game._id });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.getGameState = async (req, res) => {
  try {
    const game = await mafiaService.getLatestGame();
    if (!game) return res.status(404).json({ message: "진행 중인 게임 없음" });

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};