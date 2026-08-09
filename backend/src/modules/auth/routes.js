const express = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/otp/request', controller.requestOtp);
router.post('/otp/verify', controller.verifyOtp);
router.post('/google', controller.googleAuth);
router.get('/me', authMiddleware, controller.getMe);

module.exports = router;
