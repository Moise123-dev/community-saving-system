const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const { getTransactions, getDashboardStats, getCashFlow } = require('../controllers/accountingController');

router.get('/', protect, managerOnly, getTransactions);
router.get('/dashboard', protect, getDashboardStats);
router.get('/cashflow', protect, managerOnly, getCashFlow);

module.exports = router;
