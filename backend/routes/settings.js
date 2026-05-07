const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const { getSettings, updateSetting, initSettings } = require('../controllers/settingsController');

router.get('/', protect, getSettings);
router.post('/init', protect, managerOnly, initSettings);
router.put('/:key', protect, managerOnly, updateSetting);

module.exports = router;
