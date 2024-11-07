const Character = require('../models/Character');

exports.getCharacters = async () => {
    try {
        return await Character.find({});
    } catch (error) {
        throw new Error('서버 오류 발생');
    }
};

// exports.addCharacter = async (mainTopic, subTopics) => {
//     try {
//         const newTopic = new Topic({ mainTopic, subTopics });
//         await newTopic.save();
//         return newTopic;
//     } catch (error) {
//         console.log(error);
//         throw new Error('서버 오류가 발생했습니다.' + error.messsage);
//     }
// };