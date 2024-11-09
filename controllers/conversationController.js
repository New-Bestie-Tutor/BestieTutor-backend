const conversationService = require('../services/conversationService');

exports.getResponse = async (req, res) => {
    try {
        const { text, converseId, email, mainTopic, difficulty } = req.body;

        let conversationId = converseId;

        // 만약 converseId가 없는 경우 새 대화 생성
        if (!conversationId) {
            conversationId = await conversationService.createNewConversation(email, mainTopic, difficulty);
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