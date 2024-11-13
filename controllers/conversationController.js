const conversationService = require('../services/conversationService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.getResponse = async (req, res) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "인증 토큰이 필요합니다." });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        // DB에서 사용자 정보 조회
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        // 사용자 설정 정보 불러오기 (예: 대화 주제나 난이도 설정 등)
        const { mainTopic, subTopic, difficulty, characterName } = user.settings; // 예시: settings 필드를 통해 사용자 설정 정보 불러오기

        // 최근 대화 또는 새로운 대화 생성
        let conversationId = req.body.converseId;
        if (!conversationId) {
            const recentConversation = await Conversation.findOne({ user_id: user._id }).sort({ start_time: -1 });
            if (recentConversation) {
                conversationId = recentConversation._id;
            } else {
                const newConversation = await conversationService.createNewConversation(email, mainTopic, subTopic, difficulty, characterName);
                conversationId = newConversation.conversationId;
            }
        }

        // 대화 응답 생성
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
};