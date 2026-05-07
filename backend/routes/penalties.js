const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const {
  getPenalties,
  createPenalty,
  updatePenalty,
  markPaid,
  deletePenalty,
} = require('../controllers/penaltiesController');

router.get('/', protect, getPenalties);
router.post('/', protect, managerOnly, createPenalty);
router.put('/:id', protect, managerOnly, updatePenalty);
router.put('/:id/pay', protect, markPaid);          // both roles — members pay own only
router.delete('/:id', protect, managerOnly, deletePenalty);

module.exports = router;
