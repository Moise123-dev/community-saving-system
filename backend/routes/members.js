const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberSummary,
} = require('../controllers/membersController');

router.get('/', protect, getMembers);
router.get('/:id', protect, getMember);
router.get('/:id/summary', protect, getMemberSummary);
router.post('/', protect, managerOnly, createMember);
router.put('/:id', protect, managerOnly, updateMember);
router.delete('/:id', protect, managerOnly, deleteMember);

module.exports = router;
