const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const {
  getSavings,
  getMySavings,
  createSaving,
  updateSaving,
  deleteSaving,
  getSavingsSummary,
} = require('../controllers/savingsController');

router.get('/', protect, getSavings);
router.get('/my', protect, getMySavings);
router.get('/summary', protect, getSavingsSummary);
router.post('/', protect, createSaving);          // both roles can deposit
router.put('/:id', protect, managerOnly, updateSaving);
router.delete('/:id', protect, managerOnly, deleteSaving);

module.exports = router;
