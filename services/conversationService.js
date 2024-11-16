const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Topic = require('../models/Topic');
const Character = require('../models/Character')
const User = require('../models/User');
// const { TextToSpeechClient } = require('@google-cloud/text-to-speech');


/*
const TTS = new TextToSpeechClient({
    keyFilename: process.env.GOOGLE_API_KEY
});
*/
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 새로운 대화 생성
exports.createNewConversation = async ({ email, mainTopic, subTopic, difficulty, characterName }) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('해당 사용자를 찾을 수 없습니다.');
        }

        // 기존 대화가 존재하는지 확인
        let conversation = await Conversation.findOne({
            user_id: user._id,
            topic_description: `${mainTopic} - ${subTopic} - ${difficulty}`
        });

        // 기존 대화가 없을 때만 새로운 대화를 생성
        if (!conversation) {
            const topic = await Topic.findOne({
                mainTopic,
                'subTopics.name': subTopic
            });
        
        if (!topic) {
            console.log(`Topic not found for mainTopic: ${mainTopic}, subTopic: ${subTopic}`);
            throw new Error('해당 Topic을 찾을 수 없습니다.');
        }

        const subTopicData = topic.subTopics.find(st => st.name === subTopic);
        if (!subTopicData) {
            throw new Error('해당 SubTopic을 찾을 수 없습니다.');
        }

        const difficultyData = subTopicData.difficulties.find(d => d.difficulty === difficulty);
        if (!difficultyData) {
            throw new Error('해당 난이도를 찾을 수 없습니다.');
        }

        // Character 조회
        const character = await Character.findOne({ name: characterName });
        if (!character) {
            throw new Error('해당 Character를 찾을 수 없습니다.');
        }
    
        const prompt = `Starting conversation in the topic of ${mainTopic}, focusing on ${subTopic} at ${difficulty} difficulty. 
        The character is ${character.name}, with ${character.appearance} appearance, ${character.personality} personality, and ${character.tone} tone.`;
        
        // 새로운 Conversation 문서 생성 및 저장
        conversation = new Conversation({
            user_id: user._id,
            topic_description: `${mainTopic} - ${subTopic} - ${difficulty}`,
            start_time: new Date(),
            end_time: null // 대화가 끝날 때 업데이트
        })
        
        await conversation.save();
        
        console.log('생성된 대화 ID:', conversation._id);
    } else {
        console.log('기존 대화 사용:', conversation._id);
    }
        return { conversationId: conversation._id }; // 새롭게 생성된 converseId 반환
    } catch (error) {
        console.error('대화 생성 중 에러:', error);
        throw error;
    }
}

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
        let conversationHistory = await getConversationHistory(converseId);
        conversationHistory = [...conversationHistory, { role: 'user', content: text }]; // user 메시지 추가

        console.log("Conversation history being sent to OpenAI:", JSON.stringify(conversationHistory, null, 2));
        // OpenAI API에 메시지 전송
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: conversationHistory,
        });

        const gptResponse = response.choices[0].message.content;

        // 사용자 메시지와 GPT 응답을 MongoDB에 저장
        await new Message({
            message_id: uuidv4(),
            converse_id: converseId,
            message: text,
            message_type: 'USER',
            input_date: new Date()
        }).save();

        await new Message({
            message_id: uuidv4(),
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