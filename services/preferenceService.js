const User = require('../models/User');
const Preference = require('../models/Preference');

// 선호도 조사 생성
exports.createPreferences = async (userId, preferences) => {
    const existingUser = await User.findOne({ userId: userId });
    if (!existingUser) {
        throw new Error('존재하지 않는 사용자입니다.');
    }
    const existingPreference = await Preference.findOne({ userId: userId });
    if (existingPreference) {
        throw new Error('이미 선호도가 존재합니다. 업데이트를 진행하세요.');
    }

    const newPreference = new Preference({ userId, ...preferences });

    return await newPreference.save();
}

// 사용자 ID로 선호도 조회
exports.getPreferences = async (userId) => {
    return await Preference.findOne({ userId: userId });
}

// 사용자 ID로 선호도 업데이트 
exports.updatePreferences = async (userId, preferences) => {
    const existingPreference = await Preference.findOne({ userId: userId });
    if (!existingPreference) {
        throw new Error('선호도가 존재하지 않습니다. 먼저 생성해 주세요.');
    }

    return await Preference.findOneAndUpdate(
        { userId: userId },
        { $set: preferences },
        { new: true, runValidators: true }
    );
};