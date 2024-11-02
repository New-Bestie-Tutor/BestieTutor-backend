const mongoose = require('mongoose');

// 소주제의 난이도별 설명 스키마
const subTopicDifficultySchema = new mongoose.Schema({
    difficulty: { // 난이도 
        type: String,
        enum: ['easy', 'normal', 'hard'],
        required: true,
    },
    description: { type: String, required: true }, // 난이도에 대한 설명
});

// 소주제 스키마
const subTopicSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    difficulties: [subTopicDifficultySchema] 
});

// 대주제 모델
const topicSchema = new mongoose.Schema({
    mainTopic: { type: String, required: true },
    subTopics: [subTopicSchema]
});

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;