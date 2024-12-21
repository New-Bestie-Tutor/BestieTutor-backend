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
