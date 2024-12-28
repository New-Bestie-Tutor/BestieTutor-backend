const axios = require("axios");
const conversationService = require("../services/conversationService");
const User = require("../models/User");
const Topic = require("../models/Topic");
const Character = require("../models/Character");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");
const Language = require("../models/Language");

// 첫 발화
exports.initializeConversation = async (req, res) => {
  try {
    const {
      mainTopic,
      freeTopic,
      subTopic,
      difficulty,
      characterName,
      language,
    } = req.body;
    let initialMessage;

    // 일반 주제와 자유 주제
    if (mainTopic) {
      // 일반 주제를 입력한 경우
      if (
        !mainTopic ||
        !subTopic ||
        !difficulty ||
        !characterName ||
        !language
      ) {
        return res
          .status(400)
          .json({ message: "필수 데이터가 누락되었습니다." });
      }

      // 초기 메시지 생성
      ({ initialMessage } = await conversationService.generateInitialMessage({
        mainTopic,
        subTopic,
        difficulty,
        characterName,
        language,
      }));
    } else {
      // 자유 주제를 입력한 경우
      ({ initialMessage } =
        await conversationService.generateInitialFreeTopicMessage({
          freeTopic,
          characterName,
          language,
        }));
    }

    // TTS 변환
    const audioBuffer = await conversationService.generateTTS(
      initialMessage,
      language
    );
    console.log("TTS 요청 데이터:", language);

    // 응답 전송
    return res.status(200).json({
      message: "대화 초기화 성공",
      gptResponse: initialMessage.text || initialMessage,
      audio: audioBuffer.toString("base64"), // Base64로 인코딩된 음성 데이터
    });
  } catch (error) {
    console.error("대화 초기화 중 오류:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 전체 대화 기록 조회
exports.getConversationHistory = async (req, res) => {
  try {
    const { email } = req.params;

    // 사용자 조회
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "해당 이메일의 사용자를 찾을 수 없습니다." });
    }

    // userId로 대화 데이터 조회
    const conversations = await Conversation.find({ user_id: user._id }).sort({
      start_time: -1,
    });
    if (conversations.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 사용자의 대화를 찾을 수 없습니다." });
    }

    // 각 대화에 포함된 메시지와 피드백 데이터 추가
    const conversationDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await Message.find({
          converse_id: conversation._id,
        }).sort({ input_date: 1 });
        const feedbacks = await Feedback.find({
          converse_id: conversation._id,
        });

        return {
          conversationId: conversation._id,
          topicDescription: conversation.topic_description,
          startTime: conversation.start_time,
          endTime: conversation.end_time,
          description: conversation.description,
          messages: messages.map((message) => ({
            messageId: message.message_id,
            content: message.message,
            type: message.message_type,
            inputDate: message.input_date,
          })),
          feedbacks: feedbacks.map((feedback) => ({
            feedbackId: feedback._id,
            messageId: feedback.message_id,
            content: feedback.feedback,
            startTime: feedback.start_time,
          })),
        };
      })
    );

    res.status(200).json({ conversations: conversationDetails });
  } catch (error) {
    console.error("대화 기록 조회 중 에러:", error);
    res.status(500).json({ message: "대화 기록 조회 중 에러" });
  }
};

// converse_id로 특정 대화 기록 조회
exports.getConversationById = async (req, res) => {
  try {
    const { converse_id } = req.params;

    // 대화 조회
    const conversation = await Conversation.findOne({ _id: converse_id });
    if (!conversation) {
      return res
        .status(404)
        .json({ message: `대화 ${converse_id}를 찾을 수 없습니다.` });
    }

    // 대화에 포함된 메시지와 피드백 데이터 추가
    const messages = await Message.find({ converse_id: conversation._id }).sort(
      { input_date: 1 }
    );
    const feedbacks = await Feedback.find({ converse_id: conversation._id });

    const conversationDetail = {
      conversationId: conversation._id,
      topicDescription: conversation.topic_description,
      startTime: conversation.start_time,
      endTime: conversation.end_time,
      // 같은 converse_id인 메시지 및 피드백 가져오기
      messages: messages.map((message) => ({
        messageId: message.message_id,
        content: message.message,
        type: message.message_type,
        inputDate: message.input_date,
      })),
      feedbacks: feedbacks.map((feedback) => ({
        feedbackId: feedback._id,
        messageId: feedback.message_id,
        content: feedback.feedback,
        startTime: feedback.start_time,
      })),
    };

    res.status(200).json({ conversation: conversationDetail });
  } catch (error) {
    console.error("대화 기록 조회 중 에러:", error);
    res.status(500).json({ message: "대화 기록 조회 중 에러" });
  }
};

exports.addUserMessage = async (req, res) => {
  try {
    // 사용자 정보 가져오기
    const profileResponse = await axios.get(
      "http://localhost:3000/user/profile",
      {
        headers: {
          Authorization: req.headers["authorization"],
        },
      }
    );

    const {
      text,
      conversationHistory,
      mainTopic,
      freeTopic,
      subTopic,
      difficulty,
      characterName,
      language,
    } = req.body;

    // 요청 데이터 검증
    if (!text || !Array.isArray(conversationHistory)) {
      return res
        .status(400)
        .json({ message: "text 또는 conversationHistory가 잘못되었습니다." });
    }

    // 캐릭터 검증
    const character = await Character.findOne({ name: characterName });
    if (!character) {
      return res.status(400).json({ message: "잘못된 캐릭터 이름입니다." });
    }

    if (!freeTopic) {
      // 일반 주제인 경우
      const topic = await Topic.findOne({
        mainTopic,
        "subTopics.name": subTopic,
      });
      if (!topic) {
        return res
          .status(400)
          .json({ message: "잘못된 mainTopic 또는 subTopic입니다." });
      }

      const subTopicData = topic.subTopics.find((st) => st.name === subTopic);
      const difficultyData = subTopicData.difficulties.find(
        (d) => d.difficulty === difficulty
      );
      if (!difficultyData) {
        return res.status(400).json({ message: "잘못된 난이도입니다." });
      }
    }

    // 새 대화 생성 또는 기존 대화 재사용
    let conversationId = req.body.converseId;
    if (!conversationId) {
      const conversationData = await conversationService.createNewConversation({
        email: profileResponse.data.email,
        mainTopic: freeTopic ? null : mainTopic,
        freeTopic: freeTopic || null,
        subTopic: freeTopic ? null : subTopic,
        difficulty: freeTopic ? null : difficulty,
        characterName: character.name,
        language,
      });
      conversationId = conversationData.conversationId;
    }

    const { messageId } = await conversationService.addUserMessage(
      text,
      conversationId
    );
    await conversationService.generateFeedbackForMessage(
      messageId,
      text,
      language
    );

    res.set("Content-Type", "application/json");
    res.json({ messageId, conversationId });
  } catch (error) {
    console.error("사용자 메시지 등록 중 에러:", error);
    res.status(500).json({ message: "사용자 메시지 등록 중 에러" });
  }
};

// GPT 응답
exports.getResponse = async (req, res) => {
  try {
    // 사용자 정보 가져오기
    const profileResponse = await axios.get(
      "http://localhost:3000/user/profile",
      {
        headers: {
          Authorization: req.headers["authorization"],
        },
      }
    );

    const {
      text,
      conversationHistory,
      mainTopic,
      freeTopic,
      subTopic,
      difficulty,
      characterName,
      language,
    } = req.body;

    // 요청 데이터 검증
    if (!text || !Array.isArray(conversationHistory)) {
      return res
        .status(400)
        .json({ message: "text 또는 conversationHistory가 잘못되었습니다." });
    }

    if (!freeTopic) {
      // 대주제 및 소주제 검증
      const topic = await Topic.findOne({
        mainTopic,
        "subTopics.name": subTopic,
      });
      if (!topic) {
        return res
          .status(400)
          .json({ message: "잘못된 mainTopic 또는 subTopic입니다." });
      }

      const subTopicData = topic.subTopics.find((st) => st.name === subTopic);
      const difficultyData = subTopicData.difficulties.find(
        (d) => d.difficulty === difficulty
      );
      if (!difficultyData) {
        return res.status(400).json({ message: "잘못된 난이도입니다." });
      }

      const detail = difficultyData.detail;
    }

    // 캐릭터 검증
    const character = await Character.findOne({ name: characterName });
    if (!character) {
      return res.status(400).json({ message: "잘못된 캐릭터 이름입니다." });
    }

    // 새 대화 생성 또는 기존 대화 재사용
    let conversationId = req.body.converseId;
    if (!conversationId) {
      const conversationData = await conversationService.createNewConversation({
        email: profileResponse.data.email,
        mainTopic: freeTopic ? null : mainTopic,
        freeTopic: freeTopic || null,
        subTopic: freeTopic ? null : subTopic,
        difficulty: freeTopic ? null : difficulty,
        characterName,
        language,
      });
      conversationId = conversationData.conversationId;
    }

    // GPT 응답 생성
    const { gptResponse } = await conversationService.GPTResponse({
      text,
      converseId: conversationId,
      mainTopic,
      freeTopic,
      subTopic,
      difficulty,
      characterName,
      language,
      req,
    });

    // TTS 변환 후 텍스트와 음성 데이터 함께 응답
    const audioBuffer = await conversationService.generateTTS(
      gptResponse,
      language
    );
    res.set("Content-Type", "application/json");
    res.json({ gptResponse, audio: audioBuffer.toString("base64") });
  } catch (error) {
    console.error("대화 중 에러:", error);
    res.status(500).json({ message: "대화 중 에러" });
  }
};

// endTime Update
exports.updateEndTime = async (req, res) => {
  const { converseId } = req.body;

  if (!converseId) {
    return res.status(404).json({ message: "converseId가 필요합니다." });
  }

  try {
    const updateEndTime = await conversationService.updateEndTime(converseId);
    if (!updateEndTime) {
      return res.status(404).json({ message: "대화를 찾을 수 없습니다." });
    }
    res.status(200).json({ message: "EndTime 추가 성공", updateEndTime });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

// 언어 데이터 조회
exports.getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.find({});
    if (languages.length === 0) {
      console.error("No languages found");
      return res.status(404).json({ message: "No languages available" });
    }

    const languageInfo = languages.map((language) => ({
      name: language.name,
      code: language.code,
    }));
    return res.status(200).json({ languages: languageInfo });
  } catch (error) {
    console.error("Error while retrieving languages:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to retrieve languages due to server error" });
  }
};

// 언어 변경
exports.handleLanguageChange = async (req, res) => {
  const { userId, selectedLanguage } = req.body;

  try {
    // 선택된 언어가 Language DB에 존재하는지 확인
    const language = await Language.findOne({ name: selectedLanguage });
    if (!language) {
      console.error("Language not found:", selectedLanguage);
      return res
        .status(404)
        .json({ message: "Selected language not supported" });
    }

    // 사용자 데이터베이스에서 사용자 정보 업데이트
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.language = selectedLanguage; // 언어 필드 업데이트
    await user.save();

    return res.status(200).json({
      message: "Language successfully updated",
      language: user.language,
    });
  } catch (error) {
    console.error("Error updating language:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
