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
//     const { name, appearance, personality, tone } = req.body;

//     if (!name || !appearance || !personality || !tone ) {
//         throw new Error('캐릭터 정보를 입력해야 합니다.');
//     }

//     try {
//         const newCharacter = await characterService.addCharacter(name, appearance, personality, tone);
//         res.status(201).json({ message: '캐릭터가 추가되었습니다.', name: newCharacter });
//     } catch (error) {
//         console.error(error);
//         res.status(400).json({ message: error.message });
//     }
// };