const mongoose = require("mongoose");

// 캐릭터 모델 name 이름 appearance 외모 personality 성격 tone 말투
const characterSchema = new mongoose.Schema({
  assistant_id: { type: String, default: null },
  name: { type: String, required: true },
  appearance: { type: String, required: true },
  personality: { type: String, required: true },
  tone: { type: String, required: true },
});

const Character = mongoose.model("Character", characterSchema);

module.exports = Character;
