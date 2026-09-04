import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from './ErrorState.jsx';

export default function Forbidden({ message }) {
  const navigate = useNavigate();
  return (
    <ErrorState
      title="403 Forbidden"
      message={message || 'You do not have permission to access this page.'}
      onRetry={() => navigate('/dashboard')}
      retryLabel="Back to Dashboard"
    />
  );
}
