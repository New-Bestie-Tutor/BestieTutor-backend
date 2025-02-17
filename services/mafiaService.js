const Game = require("../models/Mafia");

exports.createGame = async (mafiaCount, roles, players) => {
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

exports.getLatestGame = async () => {
  return await Game.findOne().sort({ createdAt: -1 });
};