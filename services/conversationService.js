const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Topic = require("../models/Topic");
const Character = require("../models/Character");
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const Language = require("../models/Language");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");

require("dotenv").config(); // .env 파일 로드

const TTS = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.generateInitialMessage = async ({
  mainTopic,
  subTopic,
  difficulty,
  characterName,
  language,
}) => {
  try {
    const languageCode = await Language.findOne({ code: language });
    if (!languageCode) {
      throw new Error(`"${language}"에 해당하는 언어를 찾을 수 없습니다.`);
    }

    // 토픽과 캐릭터 데이터 확인
    const topic = await Topic.findOne({ mainTopic });
    if (!topic) {
      throw new Error("토픽을 찾을 수 없습니다.");
    }

    const subTopicData = topic.subTopics.find((sub) => sub.name === subTopic);
    if (!subTopicData) {
      throw new Error("하위 토픽을 찾을 수 없습니다.");
    }

    const difficultyData = subTopicData.difficulties.find(
      (diff) => diff.difficulty === difficulty
    );
    if (!difficultyData) {
      throw new Error(
        `"${difficulty}" 난이도에 해당하는 데이터를 찾을 수 없습니다.`
      );
    }

    const character = await Character.findOne({ name: characterName });
    if (!character) {
      throw new Error("캐릭터를 찾을 수 없습니다.");
    }

    // 공통 프롬프트
    const messages = createPrompt({
      mainTopic,
      subTopic,
      difficulty,
      detail: difficultyData.detail,
      character,
      language: languageCode,
    });

    // 첫 발화 생성
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 0.9,
    });

    const initialMessage = gptResponse.choices[0].message.content.trim();

    return { initialMessage };
  } catch (error) {
    console.error("초기 메시지 생성 중 에러:", error);
    throw error;
  }
};

// 자유 주제 첫 발화 생성
exports.generateInitialFreeTopicMessage = async ({
  freeTopic,
  characterName,
  language,
}) => {
  try {
    const languageCode = await Language.findOne({ code: language });
    if (!languageCode) {
      throw new Error(`"${language}"에 해당하는 언어를 찾을 수 없습니다.`);
    }

    const character = await Character.findOne({ name: characterName });
    if (!character) {
      throw new Error("캐릭터를 찾을 수 없습니다.");
    }

    // 자유 주제 프롬프트 생성
    const messages = createFreeTopicPrompt({
      freeTopic,
      character: character,
      language: languageCode,
    });

    // 첫 발화 생성
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 0.9,
    });

    const initialMessage = gptResponse.choices[0].message.content.trim();

    return { initialMessage };
  } catch (error) {
    console.error("초기 메시지 생성 중 에러:", error);
    throw error;
  }
};

// 자유 주제 프롬프트 생성
const createFreeTopicPrompt = ({ freeTopic, character, language }) => {
  if (!language.name || !language.prompt) {
    throw new Error(
      "언어 데이터가 잘못되었습니다. name 또는 prompt가 존재하지 않습니다."
    );
  }

  return [
    {
      role: "system",
      content: `You are acting as the character "${character.name}" with the following traits: Personality: ${character.personality}, Tone: ${character.tone}. Stay in character throughout the conversation. Respond in ${language.name}.`,
    },
    {
      role: "assistant",
      content: `The conversation is about: Topic: ${freeTopic}.
            Provide short and concise responses of 1-2 sentences, ensuring that each sentence ends with standard punctuation marks like ".", "?", or "!". Treat these punctuation marks as clear sentence boundaries and do not extend sentences unnecessarily.
            ${language.prompt}. Avoid using numbers, emojis, or other symbols, and ensure the responses feel like a natural, flowing conversation.`,
    },
  ];
};

// 새로운 대화 생성
exports.createNewConversation = async ({
  email,
  mainTopic,
  freeTopic,
  subTopic,
  difficulty,
  characterName,
  language,
}) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("해당 사용자를 찾을 수 없습니다.");
    }

    // 기존 대화가 존재하는지 확인
    const topicDescription = freeTopic
      ? freeTopic
      : `${mainTopic} - ${subTopic} - ${difficulty}`;

    let conversation = await Conversation.findOne({
      user_id: user._id,
      topic_description: topicDescription,
    });

    // 기존 대화가 없을 때만 새로운 대화를 생성
    if (!conversation) {
      let difficultyData = null;

      // 일반 주제일 경우만 검증
      if (!freeTopic) {
        const topic = await Topic.findOne({
          mainTopic,
          "subTopics.name": subTopic,
        });
        if (!topic) throw new Error("해당 Topic을 찾을 수 없습니다.");

        const subTopicData = topic.subTopics.find((st) => st.name === subTopic);
        if (!subTopicData) throw new Error("해당 SubTopic을 찾을 수 없습니다.");

        difficultyData = subTopicData.difficulties.find(
          (d) => d.difficulty === difficulty
        );
        if (!difficultyData) throw new Error("해당 난이도를 찾을 수 없습니다.");
      }

      const character = await Character.findOne({ name: characterName });
      if (!character) throw new Error("해당 Character를 찾을 수 없습니다.");

      const languageCode = await Language.findOne({ code: language });
      if (!languageCode) throw new Error("해당 language를 찾을 수 없습니다.");

      // 새로운 Conversation 문서 생성 및 저장
      conversation = new Conversation({
        user_id: user._id,
        topic_description: topicDescription,
        description: freeTopic ? "자유 주제 대화" : difficultyData.description,
        start_time: new Date(),
        end_time: null, // 대화가 끝날 때 업데이트
        selected_language: languageCode.name,
        selected_character: character.name,
      });

      await conversation.save();
      return { conversationId: conversation._id };
    } else {
      console.log("기존 대화 사용:", conversation._id);
    }
    return { conversationId: conversation._id }; // 새롭게 생성된 converseId 반환
  } catch (error) {
    console.error("대화 생성 중 에러:", error);
    throw error;
  }
};

// 전체 대화 내역을 MongoDB에서 불러오기
async function getConversationHistory(converseId) {
  try {
    // converse_id가 converseId와 일치하는 메시지들을 날짜 순서로 정렬하여 불러와 messages에 저장
    const messages = await Message.find({ converse_id: converseId }).sort({
      input_date: 1,
    });

    // MongoDB에서 가져온 메시지 데이터를 OpenAI API에 맞는 형식으로 변환
    return messages.map((msg) => ({
      role: msg.message_type === "USER" ? "user" : "assistant",
      content: msg.message,
    }));
  } catch (error) {
    console.error("대화 기록 페치 에러:", error);
    throw error;
  }
}

// 공통 프롬프트 생성 함수
const createPrompt = ({
  mainTopic,
  subTopic,
  difficulty,
  detail,
  character,
  language,
}) => {
  if (!language.name || !language.prompt) {
    throw new Error(
      "언어 데이터가 잘못되었습니다. name 또는 prompt가 존재하지 않습니다."
    );
  }

  return [
    {
      role: "system",
      content: `You are acting as the character "${character.name}" with the following traits: Personality: ${character.personality}, Tone: ${character.tone}. Stay in character throughout the conversation. Respond in ${language.name}.`,
    },
    {
      role: "assistant",
      content: `The conversation is about: Topic: ${mainTopic}, Subtopic: ${subTopic}, Difficulty: ${difficulty}, Detail: ${detail}. 
            Provide short and concise responses of 1-2 sentences, ensuring that each sentence ends with standard punctuation marks like ".", "?", or "!". Treat these punctuation marks as clear sentence boundaries and do not extend sentences unnecessarily.
            ${language.prompt}. Avoid using numbers, emojis, or other symbols, and ensure the responses feel like a natural, flowing conversation.`,
    },
  ];
};

// 메시지에 자동으로 피드백 추가
async function generateFeedbackForMessage(messageId, userText, language) {
  try {
    const languageCode = await Language.findOne({ code: language });

    const message = await Message.findOne({ message_id: messageId });
    if (!message) {
      throw new Error("Message not found.");
    }

    // 피드백 생성을 위한 prompt
    const feedbackPrompt = `You are a professional language tutor. Your task is to evaluate and provide feedback on the given user's message in Korean. 
        Provide constructive feedback on grammar, vocabulary, sentence structure, and overall clarity. 
        Offer suggestions for improvement where necessary. Keep the feedback concise and limited to one sentence. 
        Respond must be in Korean.

        User's message: "${userText}"`;

    // 피드백 생성
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant providing feedback strictly in Korean.`,
        },
        { role: "user", content: feedbackPrompt },
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
    console.error("피드백 생성 중 에러:", error);
  }
}

exports.addUserMessage = async function (text, converseId) {
  const userMessage = new Message({
    message_id: uuidv4(),
    converse_id: converseId,
    message: text,
    message_type: "USER",
    input_date: new Date(),
  });
  await userMessage.save();

  return {
    messageId: userMessage.message_id,
    conversationId: userMessage.converse_id, // 사용자 메시지 ID 반환
  };
};

exports.generateFeedbackForMessage = async function (
  messageId,
  text,
  language
) {
  // User 메시지에 대한 피드백 생성
  await generateFeedbackForMessage(messageId, text, language);
};

// GPT와 대화하고 응답을 저장
exports.GPTResponse = async function ({
  text,
  converseId,
  mainTopic,
  freeTopic,
  subTopic,
  difficulty,
  detail,
  characterName,
  language,
}) {
  try {
    const languageCode = await Language.findOne({ code: language });
    if (!languageCode) {
      throw new Error("지원되지 않는 언어입니다.");
    }

    const character = await Character.findOne({ name: characterName });
    if (!character) {
      throw new Error("찾을 수 없는 캐릭터입니다.");
    }

    // 대화 내역 가져오기
    let conversationHistory = await getConversationHistory(converseId);
    let systemPrompt;

    if (freeTopic) {
      systemPrompt = createFreeTopicPrompt({
        freeTopic,
        character: character,
        language: languageCode,
      });
    } else {
      systemPrompt = createPrompt({
        mainTopic,
        subTopic,
        difficulty,
        detail,
        character: character,
        language: languageCode,
      });
    }

    conversationHistory = [
      ...systemPrompt,
      ...conversationHistory,
      { role: "user", content: text },
    ]; // user 메시지 추가

    // OpenAI API에 메시지 전송
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 200,
      top_p: 0.9,
    });

    const gptResponse = response.choices[0].message.content;

    const botMessage = new Message({
      message_id: uuidv4(),
      converse_id: converseId,
      message: gptResponse,
      message_type: "BOT",
      input_date: new Date(),
    });
    await botMessage.save();

    return {
      gptResponse,
    };
  } catch (error) {
    console.error("GPT 대화 생성 중 에러:", error);
    throw error;
  }
};

exports.generateTTS = async function (text, language) {
  try {
    const languageCode = await Language.findOne({ code: language });
    if (!languageCode) {
      throw new Error("지원되지 않는 언어입니다.");
    }

    const [response] = await TTS.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: languageCode.voiceCode,
        ssmlGender: languageCode.ssmlGender || "NEUTRAL",
      },
      audioConfig: { audioEncoding: "MP3" },
    });

    return response.audioContent; // 음성 데이터 반환 (Buffer 형태)
  } catch (error) {
    console.error("TTS 변환 중 에러:", error);
    throw error;
  }
};

exports.updateEndTime = async (converse_id) => {
  try {
    const conversation = await Conversation.findOne({ _id: converse_id });
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    conversation.end_time = new Date();

    await conversation.save();

    return conversation;
  } catch (error) {
    console.error("Error updating end_time:", error);
    throw error;
  }
};
