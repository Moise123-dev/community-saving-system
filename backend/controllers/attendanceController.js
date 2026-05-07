const Attendance = require('../models/Attendance');
const Penalty = require('../models/Penalty');
const Setting = require('../models/Setting');

// @desc  Get all attendance records
// @route GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Attendance.countDocuments();
    const records = await Attendance.find()
      .populate('records.member', 'name email')
      .populate('recordedBy', 'name')
      .sort({ meetingDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single attendance record
// @route GET /api/attendance/:id
exports.getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate('records.member', 'name email phone')
      .populate('recordedBy', 'name');
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create attendance record (auto-apply penalties for absences)
// @route POST /api/attendance
exports.createAttendance = async (req, res) => {
  try {
    const { meetingDate, meetingTitle, location, records, notes } = req.body;

    const attendance = await Attendance.create({
      meetingDate,
      meetingTitle,
      location,
      records,
      notes,
      recordedBy: req.user._id,
    });

    // Auto-apply penalties for absent members
    const penaltySetting = await Setting.findOne({ key: 'absence_penalty' });
    const penaltyAmount = penaltySetting ? Number(penaltySetting.value) : 500;

    const absentMembers = records.filter((r) => r.status === 'absent');
    const penaltyPromises = absentMembers.map((r) =>
      Penalty.create({
        member: r.member,
        amount: penaltyAmount,
        reason: `Absent from meeting on ${new Date(meetingDate).toLocaleDateString()}`,
        type: 'absence',
        issuedBy: req.user._id,
      })
    );

    await Promise.all(penaltyPromises);

    // Mark penalty applied
    attendance.records.forEach((r) => {
      if (r.status === 'absent') r.penaltyApplied = true;
    });
    await attendance.save();

    await attendance.populate('records.member', 'name email');
    res.status(201).json({
      success: true,
      message: `Attendance recorded. ${absentMembers.length} absence penalties applied.`,
      attendance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update attendance record
// @route PUT /api/attendance/:id
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('records.member', 'name email');
    if (!attendance) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete attendance record
// @route DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
