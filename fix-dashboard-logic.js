const fs = require('fs');
const path = require('path');

const candidatePath = path.join(__dirname, 'client/src/pages/CandidateDashboard.jsx');
let candidate = fs.readFileSync(candidatePath, 'utf8');

// 1. Filter meetings so CandidateDashboard ONLY shows meetings where user is the candidate.
candidate = candidate.replace(
  /setMeetings\(meetingsRes\.data\);/,
  `const myCandidateMeetings = meetingsRes.data.filter(m => {
        const cId = m.candidateId?._id || m.candidateId;
        return cId === userRes.data._id;
      });
      setMeetings(myCandidateMeetings);`
);

// 2. Fix the "COMPLETED ASSESSMENTS" count logic.
candidate = candidate.replace(
  /\{meetings\.filter\(m => m\.status === "completed"\)\.length\}/,
  `{meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).length}`
);

fs.writeFileSync(candidatePath, candidate, 'utf8');

const interviewerPath = path.join(__dirname, 'client/src/pages/InterviewerDashboard.jsx');
let interviewer = fs.readFileSync(interviewerPath, 'utf8');

// 1. Filter completedMeetings so InterviewerDashboard ONLY shows completed meetings where user is the interviewer.
// Find `setCompletedMeetings(completedRes.data);`
interviewer = interviewer.replace(
  /setCompletedMeetings\(completedRes\.data\);/,
  `const userStr = localStorage.getItem("user");
      let myInterviewerId = null;
      if (userStr) {
        myInterviewerId = JSON.parse(userStr)._id;
      }
      const myCompleted = completedRes.data.filter(m => {
        const iId = m.interviewerId?._id || m.interviewerId;
        return iId === myInterviewerId;
      });
      setCompletedMeetings(myCompleted);`
);

fs.writeFileSync(interviewerPath, interviewer, 'utf8');
