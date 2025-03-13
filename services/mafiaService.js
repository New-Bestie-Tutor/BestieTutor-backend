const Mafia = require("../models/Mafia");

exports.setupGame = async (mafiaCount, roles, players) => {
  const newGame = new Mafia({
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
  return await Mafia.findById(gameId);
};

exports.vote = async (gameId, selectedPlayer) => {
  console.log("🔍 handleVote 실행:", { gameId, selectedPlayer });

  if (!gameId) throw new Error("gameId가 제공되지 않았습니다.");
  if (!selectedPlayer) throw new Error("selectedPlayer가 제공되지 않았습니다.");

  const game = await Mafia.findById(gameId);
  if (!game) throw new Error(`게임을 찾을 수 없습니다. (gameId: ${gameId})`);

  game.voteResult = selectedPlayer;
  await game.save();

  // 🔍 저장된 게임 정보 확인
  const updatedGame = await Mafia.findById(gameId);
  console.log("✅ 저장된 게임 상태:", updatedGame);

  return `${selectedPlayer}가 최다 득표자로 선정되었습니다.`;
};

exports.decision = async (gameId, decision) => {
  console.log("🔍 decision 실행:", { gameId, decision });

  const game = await Mafia.findById(gameId);
  if (!game) throw new Error("게임을 찾을 수 없습니다.");

  console.log("📌 현재 게임 상태:", game);

  if (!game.voteResult) throw new Error("투표 결과가 없습니다.");

  const votedPlayer = game.voteResult;
  const playerIndex = game.players.findIndex(player => player.name === votedPlayer);
  
  if (playerIndex === -1) {
      throw new Error(`선택된 플레이어(${votedPlayer})를 찾을 수 없습니다.`);
  }

  console.log(`🛠️ 처형 대상: ${game.players[playerIndex].name}, 현재 생존 여부: ${game.players[playerIndex].isAlive}`);

  if (decision === "execute") {
      game.players[playerIndex].isAlive = false; // ✅ 플레이어 사망 처리
      console.log(`🔴 ${game.players[playerIndex].name} 처형 완료!`); // ✅ 로그 추가
  } else {
      console.log(`🟢 ${game.players[playerIndex].name}가 살아남았습니다.`);
  }

  await game.save(); // ✅ 변경 사항 저장

  // ✅ 저장된 데이터 확인
  const updatedGame = await Mafia.findById(gameId);
  console.log("✅ 업데이트된 게임 상태:", updatedGame);

  return decision === "execute"
      ? `${votedPlayer}가 처형되었습니다.`
      : `${votedPlayer}가 살아남았습니다.`;
};