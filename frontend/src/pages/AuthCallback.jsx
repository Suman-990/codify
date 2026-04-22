import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    const message = searchParams.get('message') || 'Login successful';

    if (token) {
      // Save token and user data - USE CONSISTENT KEY NAMES
      localStorage.setItem('token', token);  // Changed from 'authToken' to 'token'
      localStorage.setItem('userId', id);   // Add userId for Dashboard
      
      const userData = {
        id: id ? parseInt(id) : null,
        email,
        username,
        role
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirect to your main app (dashboard/home)
      if (role === 'ADMIN') {
        navigate('/admindashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      alert('Login failed - No token received');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing your login...</p>
    </div>
  );
};

export default AuthCallback;