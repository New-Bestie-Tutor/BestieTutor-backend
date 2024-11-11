const conversationService = require('../services/conversationService');

exports.getResponse = async (req, res) => {
    try {
        console.log('요청 데이터:', req.body);
        
        const { text, converseId, email, mainTopic, subTopic, difficulty, characterName } = req.body;
        console.log('전달된 데이터:', { text, converseId, email, mainTopic, subTopic, difficulty, characterName });
        let conversationId = converseId;

        // 만약 converseId가 없는 경우 새 대화 생성
        if (!conversationId) {
            conversationId = await conversationService.createNewConversation(email, mainTopic, subTopic, difficulty, characterName);
            console.log('생성된 conversationId:', conversationId);        
        }

        const gptResponse = await conversationService.GPTResponse(text, conversationId);
        console.log('GPT:', gptResponse);

        /*
        const audioFilePath = await conversationService.TextToSpeech(gptResponse);
        console.log(audioFilePath);
        */

        res.json({ text, gptResponse, converseId: conversationId });
    } catch (error) {
        console.error('대화 중 에러:', error);
        res.status(500).json({ message: '대화 중 에러' });
    }
};