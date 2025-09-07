'use client';

import { useState } from 'react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import Image from 'next/image';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function LoginForm({
  onSubmit,
  onGoogleSignIn,
  isLoading,
  error
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password, isSignUp);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center items-center">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-base">
          Sign in to access your review reply management
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-card border w-full border-border rounded-xl shadow-sm p-6 space-y-6">
        {/* Primary Google Login */}
        <div className="space-y-4 pb-2">
          <Button
            onClick={onGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium bg-white hover:bg-white/90 text-gray-900 hover:text-black border border-primary/80 shadow-md hover:shadow-lg transition-all duration-200 "
            variant="outline"
          >
            <Image
              src="/Google-Logo.png"
              alt="Google"
              width={25}
              height={25}
              className="mr-2"
            />
            Continue with Google
          </Button>

          <p className="text-xs text-muted-foreground text-center px-4">

          </p>
        </div>

        {/* Divider */}
        <div className="relative ">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-normal tracking-wider">Or continue with email</span>
          </div>
        </div>

        {/* Email Form Toggle */}
        {!showEmailForm ? (
          <div className="pt-5">
          <Button
            onClick={() => setShowEmailForm(true)}
            variant="ghost"
            className="w-full h-10 text-sm text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-colors"
          >
            Use email instead
          </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full h-11 px-3 py-2 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    className="w-full h-11 px-3 py-2 pr-10 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              {!isSignUp && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-11 text-sm font-medium"
                variant="default"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  <>{isSignUp ? 'Create account' : 'Sign in'}</>
                )}
              </Button>
            </form>

            {/* Toggle Sign Up/In */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
                ) : (
                  <>Don&apos;t have an account? <span className="text-primary font-medium">Sign up</span></>
                )}
              </button>
            </div>

            {/* Back to Google */}
            <div className="text-center pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Google sign in
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Text */}
      <p className="text-xs text-muted-foreground text-center mt-6 px-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
