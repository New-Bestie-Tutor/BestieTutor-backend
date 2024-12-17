const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true }, // 언어 코드('ko', 'en')
    name: { type: String, required: true }, // 언어 이름('Korean', 'English')
    prompt: { type: String, required: true }, // GPT에 사용할 프롬프트
    voiceCode: { type: String, required: true }, // TTS 언어 코드('ko-KR', 'en-US')
    ssmlGender: { type: String, default: 'NEUTRAL' }, // 음성 성별 설정 ('NEUTRAL', 'FEMALE', 'MALE')
}, {timestamps: true});

const LanguageModel = mongoose.model('Language', LanguageSchema);
module.exports = LanguageModel;