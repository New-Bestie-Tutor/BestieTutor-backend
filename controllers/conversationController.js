const axios = require('axios');
const conversationService = require('../services/conversationService');
const Topic = require('../models/Topic');
const Character = require('../models/Character');

// 첫 발화
exports.initializeConversation = async (req, res) => {
    try {
        const { mainTopic, subTopic, difficulty, characterName } = req.body;

        if (!mainTopic || !subTopic || !difficulty || !characterName) {
            return res.status(400).json({ message: '필수 데이터가 누락되었습니다.' });
        }

        // 초기 메시지 생성
        const { initialMessage } = await conversationService.generateInitialMessage({
            mainTopic,
            subTopic,
            difficulty,
            characterName
        });

        // TTS 변환
        const audioBuffer = await conversationService.generateTTS(initialMessage);

        // 응답 전송
        return res.status(200).json({
            message: '대화 초기화 성공',
            gptResponse: initialMessage,
            audio: audioBuffer.toString('base64') // Base64로 인코딩된 음성 데이터
        });

    } catch (error) {
        console.error('대화 초기화 중 오류:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// GPT 응답
exports.getResponse = async (req, res) => {
    try {
        // 사용자 정보 가져오기
        const profileResponse = await axios.get('http://localhost:3000/user/profile', {
            headers: {
                Authorization: `Bearer ${req.cookies.token || req.headers['authorization']}` // 토큰 전달
            }
        });

        const { text, conversationHistory, mainTopic, subTopic, difficulty, characterName } = req.body;

        // 요청 데이터 검증
        if (!text || !Array.isArray(conversationHistory)) {
            return res.status(400).json({ message: "text 또는 conversationHistory가 잘못되었습니다." });
        }

        // 대주제 및 소주제 검증
        const topic = await Topic.findOne({ mainTopic, 'subTopics.name': subTopic });
        if (!topic) {
            return res.status(400).json({ message: '잘못된 mainTopic 또는 subTopic입니다.' });
        }

        const subTopicData = topic.subTopics.find(st => st.name === subTopic);
        const difficultyData = subTopicData.difficulties.find(d => d.difficulty === difficulty);
        if (!difficultyData) {
            return res.status(400).json({ message: '잘못된 난이도입니다.' });
        }

        // 캐릭터 검증
        const character = await Character.findOne({ name: characterName });
        if (!character) {
            return res.status(400).json({ message: '잘못된 캐릭터 이름입니다.' });
        }

        // 새 대화 생성 또는 기존 대화 재사용
        let conversationId = req.body.converseId;
        if (!conversationId) {
            const conversationData = await conversationService.createNewConversation({
                email: profileResponse.data.email,
                mainTopic,
                subTopic,
                difficulty,
                characterName
            });
            conversationId = conversationData.conversationId;
        }

        // GPT 응답 생성
        const gptResponse = await conversationService.GPTResponse(text, conversationId);

        // TTS 변환 후 텍스트와 음성 데이터 함께 응답
        const audioBuffer = await conversationService.generateTTS(gptResponse);
        res.set('Content-Type', 'application/json');
        res.json({ gptResponse, audio: audioBuffer.toString('base64') });

    } catch (error) {
        console.error('대화 중 에러:', error);
        res.status(500).json({ message: '대화 중 에러' });
    }
};