const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

// 전체 이벤트 조회
router.get("/", eventController.getEvents);

module.exports = router;
