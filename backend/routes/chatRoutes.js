const express = require('express');
const { body } = require('express-validator');
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/conversations', getConversations);
router.post('/', [body('receiver').isMongoId(), body('message').trim().notEmpty().isLength({ max: 2000 }), body('matchId').optional().isMongoId()], validate, sendMessage);
router.get('/:userId', getMessages);

module.exports = router;
