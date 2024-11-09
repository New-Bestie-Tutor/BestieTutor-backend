const OpenAI = require('openai');
const dotenv = require('dotenv');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
// const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

dotenv.config();

/*
const TTS = new TextToSpeechClient({
    keyFilename: process.env.GOOGLE_API_KEY
});
*/
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// 대화 내역을 MongoDB에서 불러오기
async function getConversationHistory(converseId) {
    try {
        // converse_id가 converseId와 일치하는 메시지들을 날짜 순서로 정렬하여 불러와 messages에 저장
        const messages = await Message.find({ converse_id: converseId }).sort({ input_date: 1 });

        // MongoDB에서 가져온 메시지 데이터를 OpenAI API에 맞는 형식으로 변환
        return messages.map(msg => ({
            role: msg.message_type === 'USER' ? 'user' : 'assistant',
            content: msg.message
        }));
    } catch (error) {
        console.error('대화 기록 페치 에러:', error);
        throw error;
    }
}

// GPT와 대화하고 응답을 저장
exports.GPTResponse = async function (text, converseId) {
    try {
        // 대화 내역 가져오기
        const conversationHistory = await getConversationHistory(converseId);

        // OpenAI API에 메시지 전송
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                ...conversationHistory,
                { role: 'user', content: text }
            ],
        });

        const gptResponse = response.choices[0].message.content;

        // 사용자 메시지와 GPT 응답을 MongoDB에 저장
        await new Message({
            converse_id: converseId,
            message: text,
            message_type: 'USER',
            input_date: new Date()
        }).save();

        await new Message({
            converse_id: converseId,
            message: gptResponse,
            message_type: 'BOT',
            input_date: new Date()
        }).save();

        return gptResponse;
    } catch (error) {
        console.error("GPT 대화 생성 중 에러:", error);
        throw error;
    }
};
/*
exports.TextToSpeech = async function (text) {
    const [response] = await TTS.synthesizeSpeech({
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
    });

    const fileName = `response${audioIndex++}.mp3`;
    fs.writeFileSync(fileName, response.audioContent, 'base64');
    return fileName;
}
*/