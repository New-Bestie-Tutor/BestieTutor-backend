// 대주제 조회
exports.getTopics = async (req, res) => {
    try {
        const topics = await Topic.find({});
        res.status(200).json(topics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 소주제 및 난이도 선택, 설명 안내: /subtopic
exports.getSubTopics = async (req, res) => {
    const { mainTopic } = req.params;

    try {
        const topic = await Topic.findOne({ mainTopic: mainTopic });
        if (!topic) {
            return res.status(404).json({ message: '대주제를 찾을 수 없습니다.' });
        }

        // 소주제 목록과 각 소주제의 난이도 정보를 포함하여 응답
        const subTopicsWithDescriptions = topic.subTopics.map(subTopic => {
            return {
                name: subTopic.name,
                difficulties: subTopic.difficulties.map(difficulty => ({
                    level: difficulty.difficulty,
                    description: difficulty.description
                }))
            };
        });

        res.status(200).json(subTopicsWithDescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 관리자: 주제 추가
exports.addTopic = async (req, res) => {
    const { mainTopic, subTopics } = req.body;

    // 필수 입력값 확인
    if (!mainTopic || !Array.isArray(subTopics) || subTopics.length === 0) {
        return res.status(400).json({ message: '대주제와 소주제를 입력해야 합니다.' });
    }

    try {
        // 새로운 대주제 생성
        const newTopic = new Topic({
            mainTopic,
            subTopics,
        });

        await newTopic.save();
        res.status(201).json({ message: '대주제가 추가되었습니다.', topic: newTopic });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};