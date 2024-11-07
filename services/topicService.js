const Topic = require('../models/Topic');

exports.getTopics = async () => {
    try {
        return await Topic.find({});
    } catch (error) {
        throw new Error('서버 오류 발생');
    }
};

exports.getSubTopics = async (mainTopic) => {
    try {
        const topic = await Topic.findOne({ mainTopic: mainTopic });
        if (!topic) {
            throw new Error('대주제를 찾을 수 없습니다.');
        }

        return topic.subTopics.map(subTopic => ({
            name: subTopic.name,
            difficulties: subTopic.difficulties.map(difficulty => ({
                level: difficulty.difficulty,
                description: difficulty.description
            }))
        }));
    } catch (error) {
        throw error;
    }
};

exports.addTopic = async (mainTopic, subTopics) => {
    try {
        const newTopic = new Topic({ mainTopic, subTopics });
        await newTopic.save();
        return newTopic;
    } catch (error) {
        console.log(error);
        throw new Error('서버 오류가 발생했습니다.' + error.messsage);
    }
};