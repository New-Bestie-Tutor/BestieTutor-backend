const OpenAI = require("openai");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { Types } = mongoose;
const User = require("../models/User");
const Topic = require("../models/Topic");
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");
const Language = require("../models/Language");
const Character = require("../models/Character");
const Conversation = require("../models/Conversation");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.initializeConversationThread = async ({
  email,
  mainTopic,
  subTopic,
  difficulty,
  freeTopic,
  characterName,
  language,
}) => {
  const user = await User.findOne({ email });
  const character = await Character.findOne({ name: characterName });
  const languageData = await Language.findOne({ code: language });

  if (!character.assistant_id) {
    const assistant = await openai.beta.assistants.create({
      name: character.name,
      instructions: `You are acting as the character "${character.name}" with the following traits: 
      Personality: ${character.personality}, Tone: ${character.tone}. 
      Stay in character throughout the conversation. 
      Respond in ${languageData.name}.`,
      model: 'gpt-4o-mini',
    });
    character.assistant_id = assistant.id;
    await character.save();
  }

  const thread = await openai.beta.threads.create();
  const topicDescription = freeTopic
    ? freeTopic
    : `${mainTopic} - ${subTopic} - ${difficulty}`;
  const description = freeTopic ? '자유 주제 대화' : `${mainTopic}-${subTopic}-${difficulty} 대화`;

  const conversation = new Conversation({
    user_id: user._id,
    thread_id: thread.id,
    start_time: new Date(),
    is_free_topic: !!freeTopic,
    topic_description: topicDescription,
    description: description,
    selected_language: languageData.name,
    selected_character: character.name,
  });

  await conversation.save();

  return {
    conversationId: conversation._id,
    threadId: thread.id,
  };
};

exports.generateInitialAssistantReply = async ({
  threadId,
  assistantId,
  conversationId,
  mainTopic,
  subTopic,
  difficulty,
  freeTopic,
  characterName,
  language,
}) => {
  const character = await Character.findOne({ name: characterName });
  if (!character || !character.assistant_id) {
    throw new Error('Character 또는 Assistant ID가 없습니다.');
  }
  const languageData = await Language.findOne({ code: language });
  
  let detail = '';
  if (!freeTopic) {
    const topic = await Topic.findOne({ mainTopic });
    const diffObj = topic?.subTopics
      ?.find(st => st.name === subTopic)
      ?.difficulties
      ?.find(d => d.difficulty === difficulty);
  
    if (!diffObj) throw new Error('유효하지 않은 주제 조합입니다');
    detail = diffObj.detail;
  }

  const systemMessage = freeTopic
    ? `The conversation is about "${freeTopic}". 
    Provide short and concise responses of 1-2 sentences, ensuring that each sentence ends with standard punctuation marks like ".", "?", or "!". 
    Treat these punctuation marks as clear sentence boundaries and do not extend sentences unnecessarily.            
    ${languageData.prompt}. Avoid using numbers, emojis, or other symbols, and ensure the responses feel like a natural, flowing conversation.`
    : `The conversation is about: Topic: ${mainTopic}, Subtopic: ${subTopic}, Difficulty: ${difficulty}, Detail: ${detail}.              
    Provide short and concise responses of 1-2 sentences, ensuring that each sentence ends with standard punctuation marks like ".", "?", or "!". 
    Treat these punctuation marks as clear sentence boundaries and do not extend sentences unnecessarily.            
    ${languageData.prompt}. Avoid using numbers, emojis, or other symbols, and ensure the responses feel like a natural, flowing conversation.`;

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: systemMessage,
  });

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: character.assistant_id,
  });

  let status;
  do {
    await new Promise((r) => setTimeout(r, 1000));
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    status = runStatus.status;
  } while (status !== 'completed');

  const messages = await openai.beta.threads.messages.list(threadId);
  const reply = messages.data.filter(m => m.role === 'assistant').at(-1)?.content.find(c => c.type === 'text')?.text?.value || '';

  if (!reply) {
    throw new Error('🛑 Assistant 응답이 비어 있습니다.');
  }

  await Message.create({
    message_id: uuidv4(),
    converse_id: conversationId,
    message: reply,
    message_type: 'BOT',
    input_date: new Date(),
  });

  return { initialText: reply, threadId };
};

exports.saveUserMessage = async ({ converseId, threadId, text }) => {
  try {
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: text
    });

    const message = new Message({
      message_id: uuidv4(),
      converse_id: converseId,
      message: text,
      message_type: 'USER',
      input_date: new Date(),
    });
    await message.save();

    return { messageId: message.message_id };

  } catch (err) {
    console.error('🛑 saveUserMessage 실패:', err);
    throw err;
  }
};

exports.generateFeedback = async ({ messageId, userText, language }) => {
  const lang = await Language.findOne({ code: language });
  const message = await Message.findOne({ message_id: messageId });

  const prompt = `다음 문장에 대해 문법, 어휘, 표현력 측면에서 피드백을 1문장으로 주세요:\n"${userText}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '피드백은 반드시 한국어로, 간결하고 명확하게 제공해주세요.' },
      { role: 'user', content: prompt },
    ],
  });

  const feedbackText = response.choices[0].message.content;

  await Feedback.create({
    feedbackId: uuidv4(),
    converse_id: message.converse_id,
    message_id: messageId,
    feedback: feedbackText,
    start_time: new Date(),
  });
};

exports.generateAssistantReply = async ({ converseId, threadId, characterName, language }) => {
  const character = await Character.findOne({ name: characterName });

  const [lastRun] = (await openai.beta.threads.runs.list(threadId, { limit: 1 })).data;
  if (lastRun && ['queued', 'in_progress', 'requires_action'].includes(lastRun.status)) {
    throw new Error('🛑 이전 run이 아직 완료되지 않았습니다.');
  }

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: character.assistant_id,
    additional_instructions: `${language} 언어로 1~2문장 응답`,
  });

  let status;
  do {
    await new Promise((r) => setTimeout(r, 500));
    const result = await openai.beta.threads.runs.retrieve(threadId, run.id);
    status = result.status;
  } while (status !== 'completed');

  const { data: [message] } = await openai.beta.threads.messages.list(threadId, {
    run_id: run.id,
    order: 'desc',
    limit: 1
  });

  const reply = message.content?.[0]?.text?.value ?? '';
  if (!reply) {
    throw new Error('🛑 Assistant 응답이 비어 있습니다.');
  }

  await Message.create({
    message_id: uuidv4(),
    converse_id: converseId,
    message: reply,
    message_type: 'BOT',
    input_date: new Date(),
  });

  return { reply };
};

exports.getConversationsByUser = async (email) => {
  const user = await User.findOne({ email });
  const conversations = await Conversation.find({ user_id: user._id }).sort({ start_time: -1 });
  return conversations;
}; 

exports.getConversationWithMessages = async (converseId) => {
  const messages = await Message.find({ converse_id: converseId }).sort({ input_date: 1 });  
  const feedbacks = await Feedback.find({ converse_id: converseId });
  return { messages, feedbacks };
};

exports.updateConversationEndTime = async (converseId) => {
  const conversation = await Conversation.findById(converseId);
  conversation.end_time = new Date();
  await conversation.save();
  return conversation;
};

exports.getSupportedLanguages = async () => {
  const languages = await Language.find();
  return languages.map((l) => ({ name: l.name, code: l.code }));
};

exports.getUserRecentLanguage = async (email) => {
  const user = await User.findOne({ email });
  const lastConv = await Conversation.findOne({ user_id: user._id }).sort({ start_time: -1 });
  return { recentLanguage: lastConv?.selected_language || null };
};

exports.updateUserLanguage = async (userId, selectedLanguage) => {
  const user = await Conversation.findOne({ user_id: userId });
  user.selected_language = selectedLanguage;
  await user.save();
  return { language: user.selected_language };
};
