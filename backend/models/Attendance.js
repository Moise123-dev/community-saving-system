const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
  penaltyApplied: { type: Boolean, default: false },
});

const attendanceSchema = new mongoose.Schema(
  {
    meetingDate: { type: Date, required: true },
    meetingTitle: { type: String, trim: true, default: 'Regular Meeting' },
    location: { type: String, trim: true },
    records: [attendanceRecordSchema],
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
