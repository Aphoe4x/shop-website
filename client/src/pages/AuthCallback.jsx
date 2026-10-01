import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      navigate('/login?error=auth_failed');
      return;
    }

    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    if (userId && email && name) {
      login({ id: userId, email, name });
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <p>Signing you in...</p>
    </div>
  );
}

export default AuthCallback;
