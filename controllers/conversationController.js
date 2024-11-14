const conversationService = require('../services/conversationService');
const authMiddleware = require('../middlewares/authMiddleware');

exports.getResponse = [
    authMiddleware, // authMiddleware를 먼저 실행하여 사용자 인증
    async (req, res) => {
        try {
            const email = req.user.email; // 미들웨어에서 추가된 사용자 정보 사용
            const { mainTopic, subTopic, difficulty, characterName } = req.user.settings;

            // 새 대화를 생성하거나 기존 대화로 응답
            const conversationId = req.body.converseId || 
                (await conversationService.createNewConversation(email, mainTopic, subTopic, difficulty, characterName)).conversationId;

            // GPT 응답 생성
            const gptResponse = await conversationService.GPTResponse(req.body.text, conversationId);
            res.json({ gptResponse });

        /*
        const audioFilePath = await conversationService.TextToSpeech(gptResponse);
        console.log(audioFilePath);
        */


    } catch (error) {
        console.error('대화 중 에러:', error);
        res.status(500).json({ message: '대화 중 에러' });
    }
    }
];