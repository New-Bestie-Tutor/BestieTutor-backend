const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.get("/", inquiryController.getAllInquiries);
router.get("/:inquiryId", inquiryController.getInquiryById);
router.post("/", authMiddleware, inquiryController.createInquiry);
router.delete(
  "/:inquiryId",
  authMiddleware,
  inquiryController.deleteInquiryById
);

module.exports = router;
