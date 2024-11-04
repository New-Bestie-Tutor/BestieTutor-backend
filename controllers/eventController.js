// 이벤트 추가
exports.addEvent = async (req, res) => {
    const { title, content } = req.body;

    // 필수 입력값 확인
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
    }

    try {
        const newEvent = new Event({
            title,
            content,
            inputDate: new Date(),
            updateDate: new Date(),
        });
        await newEvent.save();

        res.status(201).json({ status: 'success', data: newEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 추가 중 오류가 발생했습니다.' });
    }
};

// 이벤트 조회
exports.getEvent = async (req, res) => {
    try {
        const events = await Event.find().sort({ inputDate: -1 }); // 최신순 정렬
        res.status(200).json({ status: 'success', data: events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 조회 중 오류가 발생했습니다.' });
    }
};

// 이벤트 수정
exports.updateEvent = async (req, res) => {
    const { eventsId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            eventsId,
            { title, content, updateDate: new Date() },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', data: updatedEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 수정 중 오류가 발생했습니다.' });
    }
};

// 이벤트 삭제
exports.deleteEvent = async (req, res) => {
    const { eventsId } = req.params;

    try {
        const deletedEvent = await Notice.findByIdAndDelete(eventsId);

        if (!deletedEvent) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.status(200).json({ status: 'success', message: '삭제 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '이벤트 삭제 중 오류가 발생했습니다.' });
    }
};