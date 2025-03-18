const OpenAI = require("openai");
const axios = require("axios");
const Mafia = require("../models/Mafia");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  if (!gameId) throw new Error("gameId가 제공되지 않았습니다.");
  if (!selectedPlayer) throw new Error("selectedPlayer가 제공되지 않았습니다.");

  const game = await Mafia.findById(gameId);
  if (!game) throw new Error(`게임을 찾을 수 없습니다. (gameId: ${gameId})`);

  game.voteResult = selectedPlayer;
  await game.save();

  return `${selectedPlayer}가 최다 득표자로 선정되었습니다.`;
};

exports.decision = async (gameId, decision) => {
  console.log("decision 실행:", { gameId, decision });

  const game = await Mafia.findById(gameId);
  if (!game) throw new Error("게임을 찾을 수 없습니다.");

  if (!game.voteResult) throw new Error("투표 결과가 없습니다.");

  const votedPlayer = game.voteResult;
  const playerIndex = game.players.findIndex(player => player.name === votedPlayer);

  if (playerIndex === -1) {
    throw new Error(`선택된 플레이어(${votedPlayer})를 찾을 수 없습니다.`);
  }

  console.log(`처형 대상: ${game.players[playerIndex].name}, 현재 생존 여부: ${game.players[playerIndex].isAlive}`);

  if (decision === "execute") {
    game.players[playerIndex].isAlive = false; // 플레이어 사망 처리
    console.log(`${game.players[playerIndex].name} 처형 완료!`); // 로그 추가
  } else {
    console.log(`${game.players[playerIndex].name}가 살아남았습니다.`);
  }

  await game.save();

  return decision === "execute"
    ? `${votedPlayer}가 처형되었습니다.`
    : `${votedPlayer}가 살아남았습니다.`;
};

exports.nextPhase = async (gameId) => {
  const game = await Mafia.findById(gameId);
  if (!game) throw new Error("게임을 찾을 수 없음");

  if (game.status === "waiting") {
    game.status = "day";
  } else if (game.status === "day") {
    game.status = "night";
  } else if (game.status === "night") {
    // 밤 능력 결과 적용 후 낮으로 전환
    await exports.processNightActions(gameId);
    game.status = "day";
    game.day += 1;
  }

  // 게임 종료 체크
  const mafiaCount = game.players.filter(p => p.role === "Mafia" && p.isAlive).length;
  const citizenCount = game.players.filter(p => p.role !== "Mafia" && p.isAlive).length;

  if (mafiaCount === 0) {
    game.status = "ended";
    game.history.push("시민 팀이 승리했습니다!");
  } else if (mafiaCount >= citizenCount) {
    game.status = "ended";
    game.history.push("마피아 팀이 승리했습니다!");
  }

  await game.save();
  return game;
};

exports.mafiaAction = async (gameId, mafiaTarget) => {
  await Mafia.findByIdAndUpdate(gameId, { mafiaTarget });
};

exports.policeAction = async (gameId, policeTarget) => {
  const game = await Mafia.findById(gameId);
  const targetPlayer = game.players.find(p => p.name === policeTarget);
  return targetPlayer.role;
};

exports.doctorAction = async (gameId, doctorTarget) => {
  await Mafia.findByIdAndUpdate(gameId, { doctorTarget });
};

exports.autoNightActions = async (gameId) => {
  const game = await Mafia.findById(gameId);
  let updatedPlayers = [...game.players];

  // 기존 사용자가 선택한 값 유지
  let mafiaTarget = game.mafiaTarget;
  let policeTarget = game.policeTarget;
  let doctorTarget = game.doctorTarget;

  // AI 자동 선택 (선택되지 않은 경우에만)
  if (!mafiaTarget) {
    const aliveCitizens = updatedPlayers.filter(p => p.isAlive && p.role !== "Mafia");
    mafiaTarget = aliveCitizens.length > 0 ? aliveCitizens[Math.floor(Math.random() * aliveCitizens.length)].name : null;
  }

  if (!policeTarget) {
    const alivePlayers = updatedPlayers.filter(p => p.isAlive && p.role !== "Police");
    policeTarget = alivePlayers.length > 0 ? alivePlayers[Math.floor(Math.random() * alivePlayers.length)].name : null;
  }

  if (!doctorTarget) {
    const alivePlayers = updatedPlayers.filter(p => p.isAlive);
    doctorTarget = alivePlayers.length > 0 ? alivePlayers[Math.floor(Math.random() * alivePlayers.length)].name : null;
  }

  console.log(`AI 선택: 마피아 ${mafiaTarget}, 경찰 ${policeTarget}, 의사 ${doctorTarget}`);

  // 기존 사용자가 선택한 값이 있으면 AI 값 덮어쓰지 않음
  await Mafia.findByIdAndUpdate(gameId, {
    mafiaTarget: game.mafiaTarget || mafiaTarget,
    policeTarget: game.policeTarget || policeTarget,
    doctorTarget: game.doctorTarget || doctorTarget
  });

  return { mafiaTarget, policeTarget, doctorTarget };
};

exports.processNightActions = async (gameId) => {
  const game = await Mafia.findById(gameId);
  let updatedPlayers = [...game.players];

  // 기존 사용자가 선택한 값 유지
  let finalMafiaTarget = game.mafiaTarget;
  let finalPoliceTarget = game.policeTarget;
  let finalDoctorTarget = game.doctorTarget;

  // AI 자동 선택 실행 (선택되지 않은 경우만)
  const autoActions = await exports.autoNightActions(gameId);
  finalMafiaTarget = finalMafiaTarget || autoActions.mafiaTarget;
  finalPoliceTarget = finalPoliceTarget || autoActions.policeTarget;
  finalDoctorTarget = finalDoctorTarget || autoActions.doctorTarget;

  console.log(`확정된 선택 - 마피아: ${finalMafiaTarget}, 경찰: ${finalPoliceTarget}, 의사: ${finalDoctorTarget}`);

  // 경찰 조사 결과
  let policeResult = null;
  if (finalPoliceTarget) {
    const target = updatedPlayers.find(p => p.name === finalPoliceTarget);
    policeResult = target?.role || "알 수 없음";
  }

  // 마피아가 공격하고 의사가 보호하지 않으면 죽음
  if (finalMafiaTarget && finalMafiaTarget !== finalDoctorTarget) {
    updatedPlayers = updatedPlayers.map(player =>
      player.name === finalMafiaTarget ? { ...player, isAlive: false } : player
    );
  }

  // 게임 상태 업데이트
  await Mafia.findByIdAndUpdate(gameId, {
    players: updatedPlayers,
    mafiaTarget: null, // 다음 밤을 위해 초기화
    doctorTarget: null,
    policeTarget: null,
  });

  return { message: "밤이 지나갔습니다", policeResult, mafiaTarget: finalMafiaTarget };
};

const aiRoles = [
  { role: "Mafia", description: "조용히 시민을 제거하려는 마피아" },
  { role: "Police", description: "마피아를 찾으려는 경찰" },
  { role: "Doctor", description: "플레이어를 보호하는 의사" },
  { role: "Citizen1", description: "평범한 시민 1" },
  { role: "Citizen2", description: "평범한 시민 2" },
  { role: "Citizen3", description: "평범한 시민 3" },
];

// 🔹 AI가 게임 상황을 설명하는 함수
exports.aiNarration = async (game) => {
  const updatedGame = await Mafia.findById(game._id);
  const prompt = `
  당신은 마피아 게임의 사회자 AI입니다.
  현재 게임 상황:
  - 현재 날짜: ${updatedGame.day}일차
  - 살아남은 플레이어: ${updatedGame.players.length}명
  - 진행 상태: ${updatedGame.status}

  플레이어들에게 오늘의 상황을 1~2 문장으로 설명해주세요.
  `;

  console.log(`[aiNarration] GPT 요청 프롬프트:`, prompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
    });

    console.log(`[aiNarration] GPT API 응답:`, response);
    console.log(`[aiNarration] GPT 생성된 메시지:`, response.choices?.[0]?.message?.content);

    return response.choices?.[0]?.message?.content || "AI 응답을 가져오지 못했습니다.";
  } catch (error) {
    console.error(`[aiNarration] AI 생성 실패:`, error.response?.data?.error || error.message);
    throw new Error("AI 생성 실패: " + (error.response?.data?.error || error.message));
  }
};

// 🔹 AI가 플레이어의 발언을 분석하고 반응하는 함수
exports.playerResponse = async (game, playerMessage) => {
  console.log(`[playerResponse] AI 역할 수:`, aiRoles.length);
  
  const aiResponses = await Promise.all(
    aiRoles.map(async (ai) => {
      const prompt = `
      당신은 ${ai.role}입니다. (${ai.description})
      플레이어가 "${playerMessage}"라고 말했습니다.

      현재 게임 상태:
      - 현재 날짜: ${game.day}일차
      - 살아남은 플레이어: ${game.players.length}명
      - 진행 상태: ${game.status}

      이 발언에 대해 논리적인 반응을 1~2 문장으로 생성해주세요.
      `;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: prompt }],
          max_tokens: 150,
        });

        return {
          role: ai.role,
          message: response.choices?.[0]?.message?.content || "응답 없음",
        };
      } catch (error) {
        console.error(`[playerResponse] AI 응답 실패 (${ai.role}):`, error);
        return { role: ai.role, message: "AI 응답 실패" };
      }
    })
  );

  console.log(`[playerResponse] 최종 AI 응답:`, aiResponses);
  return aiResponses;
};