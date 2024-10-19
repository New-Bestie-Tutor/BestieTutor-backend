const mongoose = require('mongoose');

// MongoDB 연결 설정
mongoose.connect('mongodb://localhost:7777/bestie_tutor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('연결중...'))
.catch(err => console.error('DB 연결 에러', err));

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    language: { type: String },
    level: { type: String },
    interests: { type: [String] }
});

const User = mongoose.model('User', UserSchema);