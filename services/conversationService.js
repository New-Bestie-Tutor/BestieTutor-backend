const OpenAI = require('openai');
const dotenv = require('dotenv');
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

exports.GPTResponse = async function (text) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: text }],
    });
    return response.choices[0].message.content;
}

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