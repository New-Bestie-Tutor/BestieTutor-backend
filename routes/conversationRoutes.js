const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

/**
 * @swagger
 * /conversation/start:
 *   post:
 *     summary: 대화 시작
 *     tags: [Conversation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mainTopic:
 *                 type: string
 *               subTopic:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               characterName:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 대화 시작 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/start', conversationController.startConversation);

/**
 * @swagger
 * /conversation/{converseId}/message:
 *   post:
 *     summary: 사용자 메시지 저장 및 피드백 생성
 *     tags: [Conversation]
 *     parameters:
 *       - in: path
 *         name: converseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 메시지 저장 완료
 *       500:
 *         description: 서버 오류
 */
router.post('/:converseId/message', conversationController.sendUserMessage);

/**
 * @swagger
 * /conversation/{converseId}/reply:
 *   post:
 *     summary: Assistant 응답 생성
 *     tags: [Conversation]
 *     parameters:
 *       - in: path
 *         name: converseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               characterName:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assistant 응답 생성 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/:converseId/reply', conversationController.getAssistantReply);

/**
 * @swagger
 * /conversation/{email}/history:
 *   get:
 *     summary: 사용자의 모든 대화 조회
 *     tags: [Conversation]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 대화 목록 반환
 *       500:
 *         description: 서버 오류
 */
router.get('/:email/history', conversationController.getUserConversationList);

/**
 * @swagger
 * /conversation/{converseId}:
 *   get:
 *     summary: 특정 대화의 상세 메시지 및 피드백 조회
 *     tags: [Conversation]
 *     parameters:
 *       - in: path
 *         name: converseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 대화 상세 반환
 *       500:
 *         description: 서버 오류
 */
router.get('/:converseId', conversationController.getConversationDetail);

/**
 * @swagger
 * /conversation/{converseId}/end:
 *   put:
 *     summary: 대화 종료 시간 업데이트
 *     tags: [Conversation]
 *     parameters:
 *       - in: path
 *         name: converseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 대화 종료 완료
 *       500:
 *         description: 서버 오류
 */
router.put('/:converseId/end', conversationController.markConversationEnded);

/**
 * @swagger
 * /conversation/languages/all:
 *   get:
 *     summary: 전체 언어 목록 조회
 *     tags: [Language]
 *     responses:
 *       200:
 *         description: 언어 목록 반환
 *       500:
 *         description: 서버 오류
 */
router.get('/languages/all', conversationController.getAllLanguages);

/**
 * @swagger
 * /conversation/languages/recent/{email}:
 *   get:
 *     summary: 최근 대화에서 사용한 언어 조회
 *     tags: [Language]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 최근 언어 반환
 *       500:
 *         description: 서버 오류
 */
router.get('/languages/recent/:email', conversationController.getRecentLanguage);

/**
 * @swagger
 * /conversation/languages/change:
 *   put:
 *     summary: 사용자 언어 변경
 *     tags: [Language]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               selectedLanguage:
 *                 type: string
 *     responses:
 *       200:
 *         description: 언어 변경 성공
 *       500:
 *         description: 서버 오류
 */
router.put('/languages/change', conversationController.changeUserLanguage);

module.exports = router;