const axios = require("axios");
const conversationService = require("../services/conversationService");
require("dotenv").config();

exports.startConversation = async (req, res) => {
  try {
    const {
      mainTopic,
      subTopic,
      difficulty,
      freeTopic,
      characterName,
      language,
    } = req.body;

    const profileResponse = await axios.get(`${process.env.HOST_URL}/user/profile`, {
      headers: { Authorization: req.headers['authorization'] },
    });

    const email = profileResponse.data.email;

    const { conversationId, threadId } = await conversationService.initializeConversationThread({
      email,
      mainTopic,
      subTopic,
      difficulty,
      freeTopic,
      characterName,
      language,
    });

    const { initialText } = await conversationService.generateInitialAssistantReply({
      threadId,
      assistantId: req.body.assistantId,
      conversationId,
      mainTopic,
      subTopic,
      difficulty,
      freeTopic,
      characterName,
      language,
    });

    return res.status(200).json({
      message: '대화가 시작되었습니다.',
      gptResponse: initialText,
      conversationId,
      threadId,
    });
  } catch {
    res.status(500).json({ message: '대화 시작에 실패했습니다.' });
  }
};

exports.sendUserMessage = async (req, res) => {
  try {
    const { converseId } = req.params;
    const { threadId, text, language } = req.body;

    const { messageId } = await conversationService.saveUserMessage({ converseId, threadId, text });

    await conversationService.generateFeedback({ messageId, userText: text, language });

    res.status(200).json({ message: '메시지가 저장되었습니다.', messageId });
  } catch {
    res.status(500).json({ message: '메시지 저장에 실패했습니다.' });
  }
};

exports.getAssistantReply = async (req, res) => {
  try {
    const { converseId } = req.params;
    const { threadId, characterName, language } = req.body;

    const { reply } = await conversationService.generateAssistantReply({
      converseId,
      threadId,
      characterName,
      language,
    });

    res.status(200).json({ gptResponse: reply });
  } catch {
    res.status(500).json({ message: 'Assistant 응답 생성에 실패했습니다.' });
  }
};

exports.getUserConversationList = async (req, res) => {
  try {
    const { email } = req.params;
    const conversations = await conversationService.getConversationsByUser(email);
    res.status(200).json({ conversations });
  } catch {
    res.status(500).json({ message: '대화 목록 조회에 실패했습니다.' });
  }
};

exports.getConversationDetail = async (req, res) => {
  try {
    const { converseId } = req.params;
    const conversation = await conversationService.getConversationWithMessages(converseId);
    res.status(200).json({ conversation });
  } catch {
    res.status(500).json({ message: '대화 상세 조회에 실패했습니다.' });
  }
};

exports.markConversationEnded = async (req, res) => {
  try {
    const { converseId } = req.params;
    const result = await conversationService.updateConversationEndTime(converseId);
    res.status(200).json({ message: '대화가 종료되었습니다.', result });
  } catch {
    res.status(500).json({ message: '대화 종료 처리에 실패했습니다.' });
  }
};

exports.getAllLanguages = async (req, res) => {
  try {
    const languages = await conversationService.getSupportedLanguages();
    res.status(200).json({ languages });
  } catch {
    res.status(500).json({ message: '언어 목록을 불러오지 못했습니다.' });
  }
};

exports.getRecentLanguage = async (req, res) => {
  try {
    const { email } = req.params;
    const result = await conversationService.getUserRecentLanguage(email);
    res.status(200).json(result);
  } catch {
    res.status(500).json({ message: '최근 언어를 불러오지 못했습니다.' });
  }
};

exports.changeUserLanguage = async (req, res) => {
  try {
    const { userId, selectedLanguage } = req.body;
    const result = await conversationService.updateUserLanguage(userId, selectedLanguage);
    res.status(200).json({ message: '언어가 변경되었습니다.', result });
  } catch {
    res.status(500).json({ message: '언어 변경에 실패했습니다.' });
  }
};
