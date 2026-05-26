const fs = require('fs');
const path = require('path');

// --- CANDIDATE DASHBOARD ---
const candidatePath = path.join(__dirname, 'client/src/pages/CandidateDashboard.jsx');
let candidate = fs.readFileSync(candidatePath, 'utf8');

// Undo the filter: replace myCandidateMeetings logic back to setMeetings(meetingsRes.data)
candidate = candidate.replace(
  /const myCandidateMeetings = meetingsRes\.data\.filter\([\s\S]*?setMeetings\(myCandidateMeetings\);/,
  `setMeetings(meetingsRes.data);`
);

// Update "Technical Round with..." logic to be dynamic
candidate = candidate.replace(
  /Technical Round with \{meeting\.interviewerId\?\.name \|\| "Interviewer"\}/g,
  `{meeting.candidateId?._id === user?._id || meeting.candidateId === user?._id ? "Technical Round with " + (meeting.interviewerId?.name || "Interviewer") : "Interviewing Candidate: " + (meeting.candidateId?.name || "Unknown")}`
);

fs.writeFileSync(candidatePath, candidate, 'utf8');

// --- INTERVIEWER DASHBOARD ---
const interviewerPath = path.join(__dirname, 'client/src/pages/InterviewerDashboard.jsx');
let interviewer = fs.readFileSync(interviewerPath, 'utf8');

// Undo the filter for completedMeetings
interviewer = interviewer.replace(
  /const userStr = localStorage\.getItem\("user"\);[\s\S]*?setCompletedMeetings\(myCompleted\);/,
  `setCompletedMeetings(completedRes.data);`
);

// Update "Technical Round with..." logic to be dynamic if InterviewerDashboard uses it.
// Let's check if InterviewerDashboard has "Technical Round with"
if (interviewer.includes("Technical Round with")) {
  interviewer = interviewer.replace(
    /Technical Round with \{meeting\.candidateId\?\.name \|\| "Candidate"\}/g,
    `{meeting.interviewerId?._id === (JSON.parse(localStorage.getItem("user") || "{}"))._id ? "Technical Round with " + (meeting.candidateId?.name || "Candidate") : "As Candidate with: " + (meeting.interviewerId?.name || "Unknown")}`
  );
}

fs.writeFileSync(interviewerPath, interviewer, 'utf8');
