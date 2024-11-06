const topicService = require('../services/topicService');

// 대주제 조회
exports.getTopics = async (req, res) => {
    try {
        const topics = await topicService.getTopics();
        res.status(200).json(topics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// 소주제 및 난이도 선택, 설명 안내: /subtopic
exports.getSubTopics = async (req, res) => {
    const { mainTopic } = req.params;

    try {
        const subTopicsWithDescriptions = await topicService.getSubTopics(mainTopic);
        res.status(200).json(subTopicsWithDescriptions);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: error.message });
    }
};

// 관리자: 주제 추가
exports.addTopic = async (req, res) => {
    const { mainTopic, subTopics } = req.body;

    if (!mainTopic || !Array.isArray(subTopics) || subTopics.length === 0) {
        throw new Error('대주제와 소주제를 입력해야 합니다.');
    }

    try {
        const newTopic = await topicService.addTopic(mainTopic, subTopics);
        res.status(201).json({ message: '대주제가 추가되었습니다.', topic: newTopic });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};