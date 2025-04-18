const mongoose = require("mongoose");

const MafiaSchema = new mongoose.Schema({
  mafiaCount: Number, // 마피아 수
  roles: { police: Boolean, doctor: Boolean }, // 시민 추가 역할
  players: [
    {
      name: String,
      role: String,
      isAlive: Boolean,
    },
  ],
  phase: { type: String, default: "day" }, // 게임 진행 상태
  day: { type: Number, default: 1 }, // 현재 날짜
  gameOver: { type: Boolean, default: false }, // 게임 종료 여부
  winner: { type: String, default: null }, // 승리한 팀

  history: [{ type: String }], // 게임 진행 로그
  statusHistory: [{ day: Number, phase: String, timestamp: Date }], // 상태 변경 기록
  voteResult: { type: String, target: String }, // 투표 결과

  // 개별 역할이 선택한 대상 저장
  mafiaTarget: { type: String, default: null },
  policeTarget: { type: String, default: null },
  doctorTarget: { type: String, default: null },
}, { timestamps: true });

const Mafia = mongoose.model("Mafia", MafiaSchema);

module.exports = Mafia;