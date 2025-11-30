/**
 * ASSIGNMENT MODEL (MongoDB)
 * 
 * Purpose: Store course assignments with embedded student submissions
 * Why MongoDB?: Assignments have flexible submission types (files, links, text)
 * and benefit from embedding submissions for atomic updates and better read performance.
 * 
 * Design Decision: Embedding submissions within assignments since they're tightly coupled.
 * This allows for easy retrieval of all submissions for an assignment and prevents
 * orphaned submissions.
 */

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student_id: {
    type: Number,
    required: true,
    // References MySQL users.user_id
  },
  submitted_at: {
    type: Date,
    default: Date.now
  },
  submission_type: {
    type: String,
    enum: ['file', 'link', 'text'],
    default: 'file'
  },
  file_path: {
    type: String,
    trim: true
  },
  submission_link: {
    type: String,
    trim: true
  },
  submission_text: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  grade: {
    type: Number,
    min: 0
  },
  graded_at: {
    type: Date
  },
  graded_by: {
    type: Number,
    // References MySQL users.user_id (instructor)
  },
  feedback: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late', 'resubmit'],
    default: 'submitted'
  }
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  course_id: {
    type: Number,
    required: true,
    index: true,
    // References MySQL courses.course_id
  },
  assignment_title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  max_marks: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  due_date: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: Number,
    required: true,
    // References MySQL users.user_id (instructor)
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  },
  allow_late_submission: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    file_path: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  submissions: [submissionSchema],
  submission_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'assignments'
});

// Indexes for efficient queries
assignmentSchema.index({ course_id: 1, due_date: -1 });
assignmentSchema.index({ created_by: 1 });
assignmentSchema.index({ 'submissions.student_id': 1 });
assignmentSchema.index({ due_date: 1, is_active: 1 });

// Virtual for checking if assignment is overdue
assignmentSchema.virtual('is_overdue').get(function() {
  return new Date() > this.due_date;
});

// Method to add a submission
assignmentSchema.methods.addSubmission = function(studentId, submissionData) {
  // Check if student has already submitted
  const existingIndex = this.submissions.findIndex(
    s => s.student_id === studentId
  );
  
  const now = new Date();
  const isLate = now > this.due_date;
  
  if (!this.allow_late_submission && isLate) {
    throw new Error('Late submissions are not allowed for this assignment');
  }
  
  const submission = {
    student_id: studentId,
    submitted_at: now,
    submission_type: submissionData.submission_type || 'file',
    file_path: submissionData.file_path,
    submission_link: submissionData.submission_link,
    submission_text: submissionData.submission_text,
    remarks: submissionData.remarks,
    status: isLate ? 'late' : 'submitted'
  };
  
  if (existingIndex !== -1) {
    // Update existing submission (resubmission)
    this.submissions[existingIndex] = submission;
  } else {
    // Add new submission
    this.submissions.push(submission);
    this.submission_count = this.submissions.length;
  }
  
  this.updated_at = now;
  return this.save();
};

// Method to grade a submission
assignmentSchema.methods.gradeSubmission = function(studentId, gradeData) {
  const submission = this.submissions.find(s => s.student_id === studentId);
  
  if (!submission) {
    throw new Error('Submission not found for this student');
  }
  
  if (gradeData.grade > this.max_marks) {
    throw new Error(`Grade cannot exceed maximum marks (${this.max_marks})`);
  }
  
  submission.grade = gradeData.grade;
  submission.feedback = gradeData.feedback;
  submission.graded_by = gradeData.graded_by;
  submission.graded_at = new Date();
  submission.status = 'graded';
  
  this.updated_at = new Date();
  return this.save();
};

// Method to get submission by student
assignmentSchema.methods.getSubmissionByStudent = function(studentId) {
  return this.submissions.find(s => s.student_id === studentId);
};

// Static method to get assignments by course
assignmentSchema.statics.findByCourse = function(courseId, options = {}) {
  const { includeInactive = false } = options;
  
  const query = { course_id: courseId };
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .sort({ due_date: -1 })
    .select('-submissions'); // Don't include submissions in list view
};

// Static method to get assignment with submissions
assignmentSchema.statics.findByIdWithSubmissions = function(assignmentId) {
  return this.findById(assignmentId);
};

// Static method to get upcoming assignments
assignmentSchema.statics.findUpcoming = function(courseId = null) {
  const query = {
    due_date: { $gte: new Date() },
    is_active: true
  };
  
  if (courseId) {
    query.course_id = courseId;
  }
  
  return this.find(query)
    .sort({ due_date: 1 })
    .select('-submissions');
};

// Method to calculate submission statistics
assignmentSchema.methods.getStatistics = function() {
  const totalSubmissions = this.submissions.length;
  const gradedSubmissions = this.submissions.filter(s => s.status === 'graded').length;
  const lateSubmissions = this.submissions.filter(s => s.status === 'late').length;
  
  let avgGrade = 0;
  if (gradedSubmissions > 0) {
    const totalGrades = this.submissions
      .filter(s => s.grade !== undefined)
      .reduce((sum, s) => sum + s.grade, 0);
    avgGrade = totalGrades / gradedSubmissions;
  }
  
  return {
    total_submissions: totalSubmissions,
    graded_submissions: gradedSubmissions,
    late_submissions: lateSubmissions,
    pending_grading: totalSubmissions - gradedSubmissions,
    average_grade: Math.round(avgGrade * 100) / 100,
    average_percentage: this.max_marks > 0 
      ? Math.round((avgGrade / this.max_marks) * 10000) / 100 
      : 0
  };
};

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
