import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { TextInput } from '../components/Input';
import { OtpInput } from '../components/OtpInput';

/** Sign-in is OPTIONAL everywhere (blueprint law) — this page exists to keep
 *  history across devices. Mock: any 6-digit OTP works. */
export function Login() {
  const nav = useNavigate();
  const signIn = useStore((s) => s.signIn);
  const auth = useStore((s) => s.auth);
  const selfName = useStore((s) => s.selfName);
  const setName = useStore((s) => s.setName);

  const [step, setStep] = useState<'method' | 'otp'>('method');
  const [name, setName_] = useState(selfName);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  // already signed in → straight to dashboard
  useEffect(() => {
    if (auth.signedIn) nav('/dashboard', { replace: true });
  }, [auth.signedIn, nav]);

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function commitName() {
    if (name.trim()) setName(name.trim());
  }
  function google() {
    commitName();
    signIn('google');
    nav('/dashboard', { replace: true });
  }
  function sendOtp() {
    commitName();
    setStep('otp');
    setOtp('');
    setOtpError('');
    setResendIn(24);
  }
  function verify() {
    if (otp.length !== 6) {
      setOtpError('Enter all 6 digits');
      return;
    }
    // mock verification: any 6 digits pass
    signIn('phone', `+91 ${phone}`);
    nav('/dashboard', { replace: true });
  }

  return (
    <div className="page login">
      <header className="subhead">
        <button className="iconbtn" aria-label="Back" onClick={() => (step === 'otp' ? setStep('method') : nav(-1))}>
          ←
        </button>
        <h2>Sign in</h2>
      </header>

      {step === 'method' ? (
        <>
          <div className="login__hero">
            <div className="login__art" aria-hidden>🎪</div>
            <h1>Keep your game history</h1>
            <p className="muted">
              Your rooms, wins and stats — saved across devices. You can always play as a guest without signing in.
            </p>
          </div>

          <TextInput
            label="Your name"
            value={name}
            onChange={(e) => setName_(e.target.value)}
            placeholder="e.g. Priya"
            maxLength={20}
          />

          <Button full size="l" variant="outline" onClick={google}>
            <span className="g-mark" aria-hidden>G</span>&nbsp; Continue with Google
          </Button>

          <div className="divider">or use your phone</div>

          <div className="phone-row">
            <span className="phone-prefix">+91</span>
            <TextInput
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              aria-label="Phone number"
            />
          </div>
          <Button
            full
            size="xl"
            onClick={sendOtp}
            disabled={phone.length !== 10}
            disabledReason={phone.length ? 'Enter all 10 digits' : 'Enter your mobile number'}
          >
            Get OTP
          </Button>

          <button className="linklike" onClick={() => nav('/')}>
            Skip for now — play as guest
          </button>
          <p className="login__legal muted">
            By continuing you agree to our <a href="#terms">Terms</a> &amp; <a href="#privacy">Privacy Policy</a>.
          </p>
        </>
      ) : (
        <>
          <div className="login__hero">
            <div className="login__art" aria-hidden>📲</div>
            <h1>Enter the code</h1>
            <p className="muted">
              We sent a 6-digit code to <strong>+91 {phone}</strong>{' '}
              <button className="linklike linklike--inline" onClick={() => setStep('method')}>
                change
              </button>
            </p>
            <p className="login__demo-hint">Prototype: any 6 digits work, e.g. 123456</p>
          </div>

          <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(''); }} />
          {otpError && (
            <p className="field__error" role="alert">
              {otpError}
            </p>
          )}

          <Button full size="xl" onClick={verify} disabled={otp.length !== 6} disabledReason="Enter all 6 digits">
            Verify &amp; sign in
          </Button>

          {resendIn > 0 ? (
            <p className="center muted">Taking long? Resend in 0:{String(resendIn).padStart(2, '0')}</p>
          ) : (
            <button className="linklike" onClick={() => setResendIn(24)}>
              Resend code
            </button>
          )}
        </>
      )}
    </div>
  );
}
