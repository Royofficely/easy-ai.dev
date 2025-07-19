import React, { useState } from 'react';

interface CustomSignInProps {
  onSignIn: (email: string) => void;
}

const CustomSignIn: React.FC<CustomSignInProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    
    // Simulate sending verification email
    setTimeout(() => {
      setStep('verification');
      setIsLoading(false);
    }, 1000);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;
    
    setIsLoading(true);
    
    // Simulate verification
    setTimeout(() => {
      onSignIn(email);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '40px',
      minWidth: '400px',
      maxWidth: '500px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#000000',
          margin: '0 0 8px 0',
          fontFamily: '"Inter", sans-serif'
        }}>
          {step === 'email' ? 'Sign in to EasyAI' : 'Check your email'}
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#666666',
          margin: '0',
          fontFamily: '"Inter", sans-serif'
        }}>
          {step === 'email' 
            ? 'Enter your email address to get started'
            : `We sent a verification code to ${email}`
          }
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
              marginBottom: '8px',
              fontFamily: '"Inter", sans-serif'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                backgroundColor: isLoading ? '#f9fafb' : '#ffffff',
                color: '#000000',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#000000'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          <button
            type="submit"
            disabled={!email || isLoading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: (!email || isLoading) ? '#9ca3af' : '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif',
              cursor: (!email || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!email || isLoading) return;
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseOut={(e) => {
              if (!email || isLoading) return;
              e.currentTarget.style.backgroundColor = '#000000';
            }}
          >
            {isLoading && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isLoading ? 'Sending...' : 'Continue'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerificationSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
              marginBottom: '8px',
              fontFamily: '"Inter", sans-serif'
            }}>
              Verification code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                backgroundColor: isLoading ? '#f9fafb' : '#ffffff',
                color: '#000000',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                textAlign: 'center',
                letterSpacing: '0.5em'
              }}
              onFocus={(e) => e.target.style.borderColor = '#000000'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          <button
            type="submit"
            disabled={!verificationCode || isLoading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: (!verificationCode || isLoading) ? '#9ca3af' : '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif',
              cursor: (!verificationCode || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
            onMouseOver={(e) => {
              if (!verificationCode || isLoading) return;
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseOut={(e) => {
              if (!verificationCode || isLoading) return;
              e.currentTarget.style.backgroundColor = '#000000';
            }}
          >
            {isLoading && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isLoading ? 'Verifying...' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#666666',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: '"Inter", sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline'
            }}
          >
            Use a different email
          </button>
        </form>
      )}
      
      <div style={{
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '0',
          fontFamily: '"Inter", sans-serif'
        }}>
          Secured by EasyAI Authentication
        </p>
      </div>
    </div>
  );
};

export default CustomSignIn;