const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const {
  getLoans,
  getMyLoans,
  getLoan,
  requestLoan,
  approveLoan,
  rejectLoan,
  repayLoan,
  getMemberEligibility,
} = require('../controllers/loansController');

router.get('/', protect, getLoans);
router.get('/my', protect, getMyLoans);
router.get('/eligibility/:memberId', protect, managerOnly, getMemberEligibility);
router.get('/:id', protect, getLoan);
router.post('/', protect, requestLoan);
router.put('/:id/approve', protect, managerOnly, approveLoan);
router.put('/:id/reject', protect, managerOnly, rejectLoan);
router.post('/:id/repay', protect, repayLoan);   // both roles — members repay own loans only

module.exports = router;
