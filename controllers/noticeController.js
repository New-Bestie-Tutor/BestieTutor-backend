const noticeService = require('../services/noticeService');

// 전체 공지사항 조회
exports.getAllNotice = async (req, res) => {
    try {
        const notices = await noticeService.getAllNotices();
        res.status(200).json({ status: 'success', data: notices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
    }
};

// 특정 공지사항 조회
exports.getNotice = async (req, res) => {
    const { noticeId } = req.params;

    try {
        const foundNotice = await noticeService.getNotice(noticeId);

        if (!foundNotice) {
            return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', data: foundNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
    }
};
