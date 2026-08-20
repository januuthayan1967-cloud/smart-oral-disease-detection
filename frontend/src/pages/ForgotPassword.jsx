import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify & Reset, 3: Success
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { isSubmitting: isEmailSubmitting, errors: emailErrors },
  } = useForm();

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { isSubmitting: isResetSubmitting, errors: resetErrors },
  } = useForm();

  const newPassword = watch('password', '');

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSendOTP = async (data) => {
    try {
      setError('');
      setMessage('');
      const res = await authAPI.forgotPassword(data.email);
      setUserEmail(data.email);
      setMessage(res.data.message || 'OTP code sent to your email.');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP code. Please try again.');
    }
  };

  const onResendOTP = async () => {
    if (resendCooldown > 0 || !userEmail) return;
    try {
      setError('');
      setMessage('');
      const res = await authAPI.forgotPassword(userEmail);
      setMessage(res.data.message || 'A new OTP code has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP code.');
    }
  };

  const onResetPassword = async (data) => {
    try {
      setError('');
      setMessage('');
      await authAPI.resetPassword({
        email: userEmail,
        otp: data.otp,
        password: data.password,
      });
      setMessage('Your password has been reset successfully!');
      setStep(3);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Check your OTP and try again.');
    }
  };

  return (
    <AuthLayout
      title={
        step === 1
          ? 'Forgot Password'
          : step === 2
          ? 'Verify OTP & Reset Password'
          : 'Password Reset Successful'
      }
      subtitle={
        step === 1
          ? 'Enter your registered email to receive a 6-digit OTP code'
          : step === 2
          ? `Enter the 6-digit OTP sent to ${userEmail}`
          : 'You will be redirected to the login page shortly'
      }
    >
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl p-3.5 text-sm font-medium"
          style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
        >
          {message}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl p-3.5 text-sm font-medium"
          style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleEmailSubmit(onSendOTP)}
            className="mt-6 space-y-4"
          >
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              error={emailErrors.email?.message}
              {...registerEmail('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <Button type="submit" disabled={isEmailSubmitting} className="w-full" size="lg">
              {isEmailSubmitting ? 'Sending OTP...' : 'Send OTP Code'}
            </Button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetSubmit(onResetPassword)}
            className="mt-6 space-y-4"
          >
            <Input
              label="6-Digit OTP Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              className="tracking-widest font-mono text-center text-lg"
              error={resetErrors.otp?.message}
              {...registerReset('otp', {
                required: 'OTP code is required',
                minLength: { value: 6, message: 'OTP must be 6 digits' },
                maxLength: { value: 6, message: 'OTP must be 6 digits' },
                pattern: { value: /^[0-9]{6}$/, message: 'OTP must contain only numbers' },
              })}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={resetErrors.password?.message}
              {...registerReset('password', {
                required: 'New password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={resetErrors.confirmPassword?.message}
              {...registerReset('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (val) => val === newPassword || 'Passwords do not match',
              })}
            />

            <Button type="submit" disabled={isResetSubmitting} className="w-full" size="lg">
              {isResetSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setMessage('');
                }}
                className="text-theme-muted hover:text-theme-text transition underline"
              >
                Change Email
              </button>

              <button
                type="button"
                onClick={onResendOTP}
                disabled={resendCooldown > 0}
                className={`transition font-medium ${
                  resendCooldown > 0
                    ? 'text-theme-muted cursor-not-allowed'
                    : 'text-theme-accent hover:underline'
                }`}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-teal-500/20 text-teal-500 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <p className="text-theme-text text-sm font-medium">
              Your password has been reset successfully. Redirecting you to login...
            </p>
            <Link to="/login" className="block w-full">
              <Button className="w-full" size="lg">
                Go to Login Now
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {step !== 3 && (
        <p className="mt-6 text-center text-sm text-theme-muted">
          Remembered your password?{' '}
          <Link to="/login" className="text-theme-accent hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
