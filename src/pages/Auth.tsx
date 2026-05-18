import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { pageTransition } from '../lib/animations';

export default function AuthParams() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate('/');
        } else {
          setMessage('Account created. Check your email to confirm your account, then sign in.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      if (err.code === 'over_email_send_rate_limit') {
        setError('Supabase email sending is temporarily rate-limited. Wait a few minutes, or disable email confirmation in Supabase Auth settings for local testing.');
      } else {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <motion.div {...pageTransition} className="max-w-md mx-auto mt-16 bg-[#FFFFFF] p-10 rounded-[40px] border border-[#E2DED0] shadow-sm">
      <h2 className="text-3xl font-serif italic text-[#43423E] mb-8 text-center">
        {isLogin ? 'Welcome Back' : 'Create an Account'}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-[#F0EDE4] text-[#8A4B3C] rounded-2xl text-sm border border-[#E2DED0]">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-[#F0EDE4] text-[#5C6347] rounded-2xl text-sm border border-[#E2DED0]">
          {message}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8C887D] font-bold mb-3">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-3 bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl focus:ring-2 focus:ring-[#5C6347] focus:border-[#5C6347] outline-none transition-all text-[#43423E]"
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8C887D] font-bold mb-3">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3 bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl focus:ring-2 focus:ring-[#5C6347] focus:border-[#5C6347] outline-none transition-all text-[#43423E]"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-[#5C6347] text-[#F9F7F2] rounded-2xl font-medium hover:bg-[#4a5039] transition-colors disabled:opacity-50 mt-8"
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </motion.button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-[#E2DED0]">
        <button
          onClick={() => {
            setError(null);
            setMessage(null);
            setIsLogin(!isLogin);
          }}
          className="text-sm text-[#7A7568] hover:text-[#5C6347] font-medium transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </motion.div>
  );
}
