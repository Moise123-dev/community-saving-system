const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');

router.get('/', protect, getAttendance);
router.get('/:id', protect, getAttendanceById);
router.post('/', protect, managerOnly, createAttendance);
router.put('/:id', protect, managerOnly, updateAttendance);
router.delete('/:id', protect, managerOnly, deleteAttendance);

module.exports = router;
