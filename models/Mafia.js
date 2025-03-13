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
  status: { type: String, default: "waiting" }, // 게임 진행 상태
  day: { type: Number, default: 1 }, // 현재 날짜
  history: [{ type: String }], // 게임 진행 로그
  voteResult: { type: String, default: null }, // 투표 결과
}, { timestamps: true });

const Mafia = mongoose.model("Mafia", MafiaSchema);

module.exports = Mafia;