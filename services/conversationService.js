const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Topic = require('../models/Topic');
const Character = require('../models/Character')
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');



const TTS = new TextToSpeechClient({
    keyFilename: process.env.GOOGLE_API_KEY
});

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

            const initialPrompt = `You are acting as the character "${character.name}" with the following traits:
            - Appearance: ${character.appearance}
            - Personality: ${character.personality}
            - Tone: ${character.tone}.
            Stay in character throughout the conversation. Keep responses short, engaging, and in-character.
            The conversation is about the following:
            Topic: ${mainTopic}, Subtopic: ${subTopic}, Difficulty: ${difficulty}.
            Provide an introduction to this topic and ask an engaging question to start the conversation.`;

            // 새로운 Conversation 문서 생성 및 저장
            conversation = new Conversation({
                user_id: user._id,
                topic_description: `${mainTopic} - ${subTopic} - ${difficulty}`,
                start_time: new Date(),
                end_time: null // 대화가 끝날 때 업데이트
            })

            await conversation.save();

            // GPT의 첫 발화 생성
            const gptResponse = await this.GPTResponse(initialPrompt, conversation._id, true);
            console.log('GPT 첫 발화:', gptResponse);

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

// 메시지에 자동으로 피드백 추가
async function generateFeedbackForMessage(messageId, userText) {
    try {
        const message = await Message.findOne({ message_id: messageId });
        if (!message) {
            throw new Error("Message not found.");
        }

        // 피드백 생성을 위한 prompt
        const prompt = `You are a professional language tutor. Your task is to evaluate and provide feedback on the given user's message. 
        Provide constructive feedback on grammar, vocabulary, sentence structure, and overall clarity. 
        Offer suggestions for improvement where necessary.

        User's message: "${userText}"`;

        // 피드백 생성
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: "You are a helpful assistant." },
                { role: 'user', content: prompt }
            ],
        });

        const feedbackContent = response.choices[0].message.content;

        const newFeedback = new Feedback({
            feedbackId: uuidv4(),
            converse_id: message.converse_id,
            message_id: messageId,
            feedback: feedbackContent,
            start_time: new Date(),
        });

        await newFeedback.save();
        console.log(`Feedback added for messageId: ${messageId}`);
    } catch (error) {
        console.error('피드백 생성 중 에러:', error);
    }
}


// GPT와 대화하고 응답을 저장
exports.GPTResponse = async function (text, converseId, isInitial = false) {
    try {
        // 대화 내역 가져오기
        const conversationHistory = await getConversationHistory(converseId);

        if (isInitial) {
            conversationHistory.push({ role: 'system', content: text });
        } else {
            conversationHistory.push({ role: 'user', content: text });
        }

        // OpenAI API에 메시지 전송
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: conversationHistory,
            temperature: 0.7,
            max_tokens: 200,
            top_p: 0.9,
        });

        const gptResponse = refineResponse(response.choices[0].message.content);

        const userMessage = new Message({
            message_id: uuidv4(),
            converse_id: converseId,
            message: text,
            message_type: 'USER',
            input_date: new Date()
        });
        await userMessage.save();

        const botMessage = new Message({
            message_id: uuidv4(),
            converse_id: converseId,
            message: gptResponse,
            message_type: 'BOT',
            input_date: new Date()
        });
        await botMessage.save();

        // User 메시지에 대한 피드백 생성
        await generateFeedbackForMessage(userMessage.message_id, text);

        return gptResponse;
    } catch (error) {
        console.error("GPT 대화 생성 중 에러:", error);
        throw error;
    }
};

const refineResponse = (response) => {
    // 이모티콘 제거
    let refined = response.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}]+/gu, '');

    // 번호 제거 (예: 1., 2., 3.)
    refined = refined.replace(/^\d+\.\s+/gm, '');

    // 지나치게 공백이 많은 경우 정리
    refined = refined.replace(/\s+/g, ' ').trim();

    // 문장 단위로 나누기 (일반적으로 마침표, 느낌표, 물음표를 기준으로)
    const sentences = refined.split(/(?<=[.!?])\s+/);
    let result = '';
    for (const sentence of sentences) {
        // 150자를 넘지 않는 범위에서 문장을 추가
        if ((result + sentence).length > 150) {
            break;
        }
        result += (result ? ' ' : '') + sentence; // 문장 사이에 공백 추가
    }

    return result.length > 0 ? result + '...' : refined; // 결과 반환 (최대 150자를 초과하면 '...' 추가)
};

exports.generateTTS = async function (text) {
    try {
        const [response] = await TTS.synthesizeSpeech({
            input: { text },
            voice: { languageCode: 'ko-KR', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' },
        });

        console.log('TTS 변환 성공');
        return response.audioContent; // 음성 데이터 반환 (Buffer 형태)
    } catch (error) {
        console.error('TTS 변환 중 에러:', error);
        throw error;
    }
};