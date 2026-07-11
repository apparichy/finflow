import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { supabase } from '../supabase';

export default function Auth() {
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

  const submit = async (e) => {
        e.preventDefault();
        setMsg(null);
        setBusy(true);
        try {
                if (mode === 'signup') {
                          const { error } = await supabase.auth.signUp({ email, password });
                          if (error) throw error;
                          setMsg({ type: 'info', text: 'Account created! Check your email for a confirmation link, then sign in. (If you disabled email confirmation in Supabase, just sign in.)' });
                          setMode('signin');
                } else {
                          const { error } = await supabase.auth.signInWithPassword({ email, password });
                          if (error) throw error;
                }
        } catch (err) {
                setMsg({ type: 'error', text: err.message || 'Something went wrong.' });
        } finally {
                setBusy(false);
        }
  };

  return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
                <div className="card" style={{ width: '100%', maxWidth: 400 }}>
                          <div className="brand" style={{ paddingLeft: 0 }}>
                                      <div className="brand-badge"><Wallet size={18} /></div>div>
                                    FinFlow
                          </div>div>
                        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
                          {mode === 'signin' ? 'Sign in to sync your finances across devices.' : 'Create a free account - your data stays private to you.'}
                        </p>p>
                
                  {msg && (
                    <div className="alert" style={{
                                  background: msg.type === 'error' ? 'var(--red-soft)' : 'var(--blue-soft)',
                                  color: 'var(--text)', marginBottom: 14,
                    }}>
                      {msg.text}
                    </div>div>
                        )}
                
                        <form onSubmit={submit}>
                                  <div className="field">
                                              <label>Email</label>label>
                                              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                                  </div>div>
                                  <div className="field">
                                              <label>Password</label>label>
                                              <input type="password" required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                                  </div>div>
                                  <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                                    {busy ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                                  </button>button>
                        </form>form>
                
                        <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null); }}>
                          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
                        </button>button>
                </div>div>
        </div>div>
      );
}
</div>
