const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const Mafia = require("../models/Mafia");
const MafiaConversation = require("../models/MafiaConversation");
const MafiaMessage = require("../models/MafiaMessage");

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

  console.log("[Before] game.phase:", game.phase);

  if (game.phase === "waiting") {
    game.phase = "day";
  } else if (game.phase === "day") {
    game.phase = "night";
  } else if (game.phase === "night") {
    // 밤 능력 결과 적용 후 낮으로 전환
    await exports.processNightActions(gameId);
    game.phase = "day";
    game.day += 1;
  }

  console.log("[After] game.phase:", game.phase);

  // 게임 종료 체크
  const mafiaCount = game.players.filter(p => p.role === "Mafia" && p.isAlive).length;
  const citizenCount = game.players.filter(p => p.role !== "Mafia" && p.isAlive).length;

  if (mafiaCount === 0) {
    game.gameOver = true;
    game.winner = "Citizens";
    game.history.push("시민 팀이 승리했습니다!");
  } else if (mafiaCount >= citizenCount) {
    game.gameOver = true;
    game.winner = "Mafia";
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
  const players = game.players;

  const getRandomTarget = (filterFn) => {
    const options = players.filter(filterFn);
    return options.length > 0 ? options[Math.floor(Math.random() * options.length)].name : null;
  };

  const mafiaTarget = getRandomTarget(p => p.isAlive && p.role !== "Mafia");
  const policeTarget = getRandomTarget(p => p.isAlive && p.role !== "Police");
  const doctorTarget = getRandomTarget(p => p.isAlive);

  return { mafiaTarget, policeTarget, doctorTarget };
};

exports.processNightActions = async (gameId) => {
  const game = await Mafia.findById(gameId);
  let updatedPlayers = [...game.players];

  let { mafiaTarget, policeTarget, doctorTarget } = game;
  const autoActions = await exports.autoNightActions(gameId);

  // AI만 있는 역할은 자동 선택값 적용
  if (!mafiaTarget) mafiaTarget = autoActions.mafiaTarget;
  if (!policeTarget) policeTarget = autoActions.policeTarget;
  if (!doctorTarget) doctorTarget = autoActions.doctorTarget;

  // DB에 최종 선택값 업데이트
  await Mafia.findByIdAndUpdate(gameId, {
    mafiaTarget,
    policeTarget,
    doctorTarget
  });

  // 경찰 조사 결과
  let policeResult = null;
  if (policeTarget) {
    const target = updatedPlayers.find(p => p.name === policeTarget);
    policeResult = target?.role || "알 수 없음";
  }

  // 마피아 공격 처리
  if (mafiaTarget) {
    const targetPlayer = updatedPlayers.find(p => p.name === mafiaTarget);
    if (!targetPlayer) {
      console.log(`[❌] 타겟 ${mafiaTarget}을 찾을 수 없습니다.`);
    } else if (mafiaTarget === doctorTarget) {
      console.log(`[🛡️] ${mafiaTarget}은 의사의 보호로 살아남았습니다.`);
    } else {
      console.log(`[☠️] ${mafiaTarget}은 마피아에게 살해당했습니다.`);
      updatedPlayers = updatedPlayers.map(p =>
        p.name === mafiaTarget ? { ...p, isAlive: false } : p
      );
    }
  }

  // 최종 상태 반영
  await Mafia.findByIdAndUpdate(gameId, {
    players: updatedPlayers,
    mafiaTarget: null,
    policeTarget: null,
    doctorTarget: null
  });

  return {
    message: mafiaTarget === doctorTarget
      ? `마피아가 ${mafiaTarget}을 공격했지만 의사의 보호로 살아남았습니다.`
      : mafiaTarget
        ? `마피아가 ${mafiaTarget}을 공격했습니다.`
        : `마피아는 이번 밤에 아무도 공격하지 않았습니다.`,
    policeResult,
    mafiaTarget
  };
};

// 🔹 AI가 게임 상황을 설명하는 함수
exports.aiNarration = async (game) => {
  console.log(`[aiNarration] 요청받은 game._id:`, game._id);
  const updatedGame = await Mafia.findById(game._id);
  if (!updatedGame) {
    throw new Error(`[aiNarration] gameId ${game._id}로 게임을 찾을 수 없습니다.`);
  }
  const alivePlayers = updatedGame.players.filter(p => p.isAlive).length;
  const prompt = `
  당신은 마피아 게임의 사회자 AI입니다.
  현재 게임 상황:
  - 현재 날짜: ${updatedGame.day}일차
  - 살아남은 플레이어: ${alivePlayers}명
  - 진행 상태: ${updatedGame.phase}

  플레이어들에게 오늘의 상황을 1~2 문장으로 설명해주세요.
  `;

  console.log(`[aiNarration] GPT 요청 프롬프트:`, prompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
    });

    console.log(`[aiNarration] GPT 생성된 메시지:`, response.choices?.[0]?.message?.content);

    return response.choices?.[0]?.message?.content || "AI 응답을 가져오지 못했습니다.";
  } catch (error) {
    console.error(`[aiNarration] AI 생성 실패:`, error.response?.data?.error || error.message);
    throw new Error("AI 생성 실패: " + (error.response?.data?.error || error.message));
  }
};

// 🔹 플레이어의 발언을 분석하고 반응하는 함수
exports.playerResponse = async (game, playerMessage) => {
  const messages = await MafiaMessage.find({ game_id: game._id }).sort({ input_date: 1 });
  const alivePlayers = game.players.filter(p => p.isAlive).length;

  console.log("입력 메시지:", playerMessage);

  const chatHistory = messages.map(msg => ({
    role: msg.message_type === "USER" ? "user" : "assistant",
    content: msg.message
  }));

  // 🔹 플레이어 발언 저장
  const pMessage = new MafiaMessage({
    message_id: uuidv4(),
    game_id: game._id,
    message: playerMessage,
    message_type: "USER",
    input_date: new Date()
  });
  await pMessage.save();

  // 🔹 실제 플레이어가 맡은 역할들 (예: "Player"라는 이름 기준)
  const playerRoles = game.players
    .filter(p => p.name === "Player")
    .map(p => p.role.toUpperCase());

  const allAiRoles = game.players
    .filter(p => p.name !== "Player" && p.isAlive)
    .map(p => ({
      role: p.role.toUpperCase(),
      name: p.name,
      description: getRoleDescription(p.role.toUpperCase()),
    }));

  const allowDuplicateRoles = ['CITIZEN'];

  const aiRoles = allAiRoles.filter(ai => {
    if (allowDuplicateRoles.includes(ai.role)) return true;
    return !playerRoles.includes(ai.role);
  });

  function getRoleDescription(role) {
    switch (role) {
      case "MAFIA": return "조용히 시민을 제거하려는 마피아";
      case "POLICE": return "마피아를 찾으려는 경찰";
      case "DOCTOR": return "플레이어를 보호하는 의사";
      case "CITIZEN": return "평범한 시민";
      default: return "기타 역할";
    }
  }

  // 🔹 AI 응답 처리
  const aiResponses = await Promise.all(
    aiRoles.map(async (ai) => {
      const prompt = `
      당신은 ${ai.role}입니다. (${ai.description})
      당신의 이름은 ${ai.name}입니다.
      플레이어가 "${playerMessage}"라고 말했습니다.

      현재 게임 상태:
      - 현재 날짜: ${game.day}일차
      - 살아남은 플레이어: ${alivePlayers}명
      - 진행 상태: ${game.phase}

      이 발언에 대해 논리적인 반응을 1~2 문장으로 생성해주세요.
      `;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: prompt }, ...chatHistory],
          max_tokens: 150,
        });

        return {
          role: ai.role,
          name: ai.name,
          message: response.choices?.[0]?.message?.content || "응답 없음",
        };
      } catch (error) {
        console.error(`[playerResponse] AI 응답 실패 (${ai.name}):`, error);
        return { role: ai.name, message: "AI 응답 실패" };
      }
    })
  );

  // 🔹 AI 응답 DB 저장
  const aiMessages = aiResponses.map(ai => ({
    message_id: uuidv4(),
    game_id: game._id,
    message: ai.message,
    message_type: "BOT",
    role: ai.role,
    name: ai.name,
    input_date: new Date(),
  }));
  await MafiaMessage.insertMany(aiMessages);

  console.log(`[playerResponse] 최종 AI 응답:`, aiResponses);
  return aiResponses;
};