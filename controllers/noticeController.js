const noticeService = require('../services/noticeService');

// 공지사항 추가
exports.addNotice = async (req, res) => {
    const { title, content } = req.body;

    // 필수 입력값 확인
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
    }

    try {
        const newNotice = await noticeService.addNotice(title, content);
        res.status(201).json({ status: 'success', data: newNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 추가 중 오류가 발생했습니다.' });
    }
};

// 공지사항 수정
exports.updateNotice = async (req, res) => {
    const { noticeId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    try {
        const updatedNotice = await noticeService.updateNotice(noticeId, title, content);
        
        if (!updatedNotice) {
            return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', data: updatedNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 수정 중 오류가 발생했습니다.' });
    }
};

// 공지사항 삭제
exports.deleteNotice = async (req, res) => {
    const { noticeId } = req.params;

    try {
        const deletedNotice = await noticeService.deleteNotice(noticeId);

        if (!deletedNotice) {
            return res.status(404).json({ message: '해당 공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', message: '삭제 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '공지사항 삭제 중 오류가 발생했습니다.' });
    }
};

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
