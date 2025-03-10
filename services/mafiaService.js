const Game = require("../models/Mafia");

exports.setupGame = async (mafiaCount, roles, players) => {
  const newGame = new Game({
    mafiaCount,
    roles,
    players,
    status: "waiting",
    day: 1,
    history: [],
  });

  return await newGame.save();
};

exports.getGameState = async (gameId) => {
  return await Game.findById(gameId);
};