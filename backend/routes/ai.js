const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/generate-email', aiController.generateEmail);
router.post('/improve', aiController.improveEmail);
router.post('/grammar', aiController.checkGrammar);
router.post('/tone', aiController.changeTone);
router.post('/summary', aiController.summarizeEmail);
router.post('/translate', aiController.translateEmail);
router.get('/history', aiController.getHistory);

module.exports = router;