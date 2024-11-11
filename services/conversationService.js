const OpenAI = require('openai');
const dotenv = require('dotenv');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Topic = require('../models/Topic');
const User = require('../models/User');
const Character = require('../models/Character')
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

// 새로운 대화 생성
exports.createNewConversation = async function (email, mainTopic, subTopic, difficulty, characterName) {
    try {
        console.log('전달된 email:', email);
        // 이메일로 사용자 조회
        const user = await User.findOne({ email });
        console.log('조회된 사용자:', user);
        if (!user) throw new Error("사용자를 찾을 수 없습니다.");

        // Topic 모델에서 mainTopic으로 조회
        const topic = await Topic.findOne({ mainTopic });
        console.log('조회된 Topic:', topic);
        if (!topic) throw new Error("해당 Topic을 찾을 수 없습니다.");

        const SubTopic = topic.subTopics.find(st => st.name === subTopic);
        console.log('조회된 SubTopic:', SubTopic);
        if (!SubTopic) throw new Error("해당 subTopic을 찾을 수 없습니다.");

        const difficultyDescription = SubTopic.difficulties.find(diff => diff.difficulty === difficulty);
        console.log('조회된 Difficulty Description:', difficultyDescription);
        if (!difficultyDescription || !difficultyDescription.description) throw new Error("해당 description을 찾을 수 없습니다.");        

        // 캐릭터 찾기
        const character = await Character.findOne({ name: characterName });
        console.log('조회된 캐릭터:', character);
        if (!character) throw new Error("캐릭터를 찾을 수 없습니다.");
    
        const prompt = `Starting conversation in the topic of ${mainTopic}, focusing on ${subTopic} at ${difficulty} difficulty. 
        The character is ${character.name}, with ${character.appearance} appearance, ${character.personality} personality, and ${character.tone} tone.`;
        
        // 새로운 Conversation 문서 생성 및 저장
        const newConversation = new Conversation({
            user_id: user._id,
            topic_description: difficultyDescription.description,
            start_time: new Date(),
            end_time: null // 대화가 끝날 때 업데이트
        })
        
        await newConversation.save();
        
        console.log('생성된 대화 ID:', newConversation._id);
        return { conversationId: newConversation._id, prompt }; // 새롭게 생성된 converseId 반환
    } catch (error) {
        console.error('대화 생성 중 에러:', error);
        throw error;
    }
}

// 대화 내역을 MongoDB에서 불러오기
async function getConversationHistory(converseId) {
    try {
        // converse_id가 converseId와 일치하는 메시지들을 날짜 순서로 정렬하여 불러와 messages에 저장
        const messages = await Message.find({ converse_id: converseId._id }).sort({ input_date: 1 });

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
exports.GPTResponse = async function (text, conversationHistory) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            ...conversationHistory,
            { role: 'user', content: text }
        ],
    });
    return response.choices[0].message.content;
};
*/

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