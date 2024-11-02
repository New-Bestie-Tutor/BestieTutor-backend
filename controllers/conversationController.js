const conversationService = require('../services/conversationService');

exports.getResponse = async (req, res) => {
    try {
        const { text } = req.body;

        const gptResponse = await conversationService.GPTResponse(text);
        console.log('GPT:', gptResponse);

        /*
        const audioFilePath = await conversationService.TextToSpeech(gptResponse);
        console.log(audioFilePath);
        */

        res.json({ text, gptResponse });
    } catch (error) {
        console.error('대화 중 에러:', error);
        res.status(500).json({ message: '대화 중 에러' });
    }
};