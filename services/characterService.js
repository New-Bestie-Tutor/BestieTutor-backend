const Character = require('../models/Character');

exports.getCharacters = async () => {
    try {
        return await Character.find({});
    } catch (error) {
        throw new Error('서버 오류 발생');
    }
};

// exports.addCharacter = async (name, appearance, personality, tone) => {
//     try {
//         const newCharacter = new Character({ name, appearance, personality, tone });
//         await newCharacter.save();
//         return newCharacter;
//     } catch (error) {
//         console.log(error);
//         throw new Error('서버 오류가 발생했습니다.' + error.messsage);
//     }
// };