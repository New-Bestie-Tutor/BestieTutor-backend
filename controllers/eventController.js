const eventService = require('../services/eventService');

// 이벤트 조회
exports.getEvents = async (req, res) => {
    try {
        const events = await eventService.getEvents();
        res.status(200).json({ status: 'success', data: events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 조회 중 오류가 발생했습니다.' });
    }
};
