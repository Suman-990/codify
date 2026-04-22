import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";    
import AuthCallback from "./pages/AuthCallback";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import Problem from "./pages/Problem";
import SubmissionResult from "./pages/Submission";
import UserProfile from "./pages/UserProfile";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      
        <Route path="/admindashboard" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />

        <Route path="/problems/:questionId" element={
          <PrivateRoute>
            <Problem />
          </PrivateRoute>
        } />
          <Route path="/submissions/:submissionId" element={
          <PrivateRoute>
            <SubmissionResult />
          </PrivateRoute>
        } />
          <Route path="/profile/:userId" element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}