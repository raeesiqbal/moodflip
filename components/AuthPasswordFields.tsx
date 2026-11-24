'use client';

import { useState } from 'react';

type AuthPasswordFieldsProps = {
  currentPassword?: string;
  password: string;
  confirmPassword: string;
  onCurrentPasswordChange?: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  disabled?: boolean;
  currentPasswordLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  currentPasswordPlaceholder?: string;
  passwordPlaceholder?: string;
  confirmPasswordPlaceholder?: string;
  idPrefix?: string;
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return 0;
  if (password.length < 6) return 1;
  if (password.length < 10) return 2;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 4;
  return 3;
}

export default function AuthPasswordFields({
  currentPassword,
  password,
  confirmPassword,
  onCurrentPasswordChange,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
  currentPasswordLabel = 'Current password',
  passwordLabel = 'Password',
  confirmPasswordLabel = 'Confirm password',
  currentPasswordPlaceholder = 'Enter your current password',
  passwordPlaceholder = 'Create a password',
  confirmPasswordPlaceholder = 'Confirm your password',
  idPrefix = 'auth',
}: AuthPasswordFieldsProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const strength = getPasswordStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const passwordsDiffer = Boolean(confirmPassword && confirmPassword !== password);

  return (
    <>
      {currentPassword !== undefined && onCurrentPasswordChange && (
        <div>
          <label htmlFor={`${idPrefix}-current-password`} className="block text-xs font-bold text-[#5C527A] mb-1">{currentPasswordLabel}</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm" aria-hidden="true">🔒</span>
            <input
              id={`${idPrefix}-current-password`}
              type={showCurrentPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => onCurrentPasswordChange(event.target.value)}
              placeholder={currentPasswordPlaceholder}
              disabled={disabled}
              className="w-full h-10 pl-10 pr-10 rounded-xl border border-[#E4DAD7] bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none focus:border-[#7464AC] transition"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((visible) => !visible)}
              disabled={disabled}
              className="absolute right-3.5 top-2.5 text-[#A49BA8] hover:text-[#7464AC] transition cursor-pointer disabled:cursor-default"
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
              <EyeIcon hidden={showCurrentPassword} />
            </button>
          </div>
        </div>
      )}

      <div>
        <label htmlFor={`${idPrefix}-password`} className="block text-xs font-bold text-[#5C527A] mb-1">{passwordLabel}</label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm" aria-hidden="true">🔒</span>
          <input
            id={`${idPrefix}-password`}
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder={passwordPlaceholder}
            disabled={disabled}
            className="w-full h-10 pl-10 pr-10 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none focus:border-[#7464AC] transition"
            style={{ borderColor: '#E4DAD7' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={disabled}
            className="absolute right-3.5 top-2.5 text-[#A49BA8] hover:text-[#7464AC] transition cursor-pointer disabled:cursor-default"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon hidden={showPassword} />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-[#5C527A]">At least 8 characters.</p>
        {password && (
          <div className="mt-1 text-[10px] text-[#5C527A]" aria-live="polite">
            <div className="flex w-full gap-1 h-1" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="flex-1 rounded-full transition-colors"
                  style={{
                    background: strength >= level
                      ? level <= 1 ? '#E49C8C' : level <= 2 ? '#EDAA7A' : level <= 3 ? '#7D8164' : '#7464AC'
                      : '#E4DAD7',
                  }}
                />
              ))}
            </div>
            <p className="mt-1">Strength: {strengthLabels[strength]}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-confirm-password`} className="block text-xs font-bold text-[#5C527A] mb-1">{confirmPasswordLabel}</label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-[#A49BA8] text-sm" aria-hidden="true">🔒</span>
          <input
            id={`${idPrefix}-confirm-password`}
            type={showConfirmPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder={confirmPasswordPlaceholder}
            disabled={disabled}
            className="w-full h-10 pl-10 pr-10 rounded-xl border bg-[#FEFAF8] text-sm text-[#1A143F] focus:outline-none focus:border-[#7464AC] transition"
            style={{ borderColor: passwordsDiffer ? '#E49C8C' : '#E4DAD7' }}
            aria-invalid={passwordsDiffer}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((visible) => !visible)}
            disabled={disabled}
            className="absolute right-3.5 top-2.5 text-[#A49BA8] hover:text-[#7464AC] transition cursor-pointer disabled:cursor-default"
            aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
          >
            <EyeIcon hidden={showConfirmPassword} />
          </button>
        </div>
      </div>
    </>
  );
}
