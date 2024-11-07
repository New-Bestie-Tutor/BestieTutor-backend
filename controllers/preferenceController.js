const preferenceService = require('../services/preferenceService');

exports.createPreferences = async (req, res) => {
    const { userId, language, learningGoals, preferredTopics, currentSkillLevel } = req.body;

    try {
        const preferences = await preferenceService.createPreferences(userId, {
            language,
            learningGoals,
            preferredTopics,
            currentSkillLevel
        });
        res.status(201).json({ message: '선호도 조사 완료', preferences });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: '선호도 조사 실패', error: error.message });
    }
};

exports.getPreferences = async (req, res) => {
    const { userId } = req.params;

    try {
        const preferences = await preferenceService.getPreferences(userId);
        if (!preferences) {
            return res.status(404).json({ message: '선호도를 찾을 수 없습니다.' });
        }
        res.status(200).json(preferences);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '선호도 조회 실패', error: error.message });
    }
};

exports.updatePreferences = async (req, res) => {
    const { userId } = req.params;
    const { language, learningGoals, preferredTopics, currentSkillLevel } = req.body;

    try {
        const updatedPreferences = await preferenceService.updatePreferences(userId, {
            language,
            learningGoals,
            preferredTopics,
            currentSkillLevel
        });
        res.status(200).json({ message: '선호도 수정 완료', preferences: updatedPreferences });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '선호도 수정 실패', error: error.message });
    }
};