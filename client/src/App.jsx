import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOTP from "./pages/VerifyOTP";
import CandidateDashboard from "./pages/CandidateDashboard";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import MeetingRoom from "./pages/MeetingRoom";
import PracticePage from "./pages/PracticePage";
import AdaptivePractice from "./pages/AdaptivePractice";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative text-white bg-transparent">
        {/* Global Grid bg */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
          }}
        />
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Protected Dashboards */}
        <Route
          path="/candidate-dashboard"
          element={
            <ProtectedRoute>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviewer-dashboard"
          element={
            <ProtectedRoute>
              <InterviewerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meeting/:id"
          element={
            <ProtectedRoute>
              <MeetingRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <PracticePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adaptive-practice"
          element={
            <ProtectedRoute>
              <AdaptivePractice />
            </ProtectedRoute>
          }
        />
        </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
