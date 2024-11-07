const characterService = require('../services/characterService');

// 캐릭터 조회
exports.getCharacters = async (req, res) => {
    try {
        const characters = await characterService.getCharacters();
        res.status(200).json(characters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// 관리자: 캐릭터 추가
// exports.addCharacter = async (req, res) => {
//     const { mainTopic, subTopics } = req.body;

//     if (!mainTopic || !Array.isArray(subTopics) || subTopics.length === 0) {
//         throw new Error('대주제와 소주제를 입력해야 합니다.');
//     }

//     try {
//         const newTopic = await topicService.addTopic(mainTopic, subTopics);
//         res.status(201).json({ message: '대주제가 추가되었습니다.', topic: newTopic });
//     } catch (error) {
//         console.error(error);
//         res.status(400).json({ message: error.message });
//     }
// };