const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const { getMemberReport, getFinancialReport, getLoanReport } = require('../controllers/reportsController');

router.get('/members', protect, managerOnly, getMemberReport);
router.get('/financial', protect, managerOnly, getFinancialReport);
router.get('/loans', protect, managerOnly, getLoanReport);

module.exports = router;
