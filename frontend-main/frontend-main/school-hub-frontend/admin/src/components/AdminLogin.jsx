import { useState, useRef, useEffect } from 'react'
import styles from './AdminLogin.module.css'

export default function AdminLogin({ onLogin }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resend, setResend] = useState(0)
  const refs = useRef([])
  const timer = useRef(null)

  function startTimer() {
    setResend(30)
    timer.current = setInterval(() => setResend(t => { if (t <= 1) { clearInterval(timer.current); return 0 } return t - 1 }), 1000)
  }

  function handleLogin(e) {
    e.preventDefault()
    if (email && password) { setStep('otp'); startTimer(); setTimeout(() => refs.current[0]?.focus(), 100) }
  }

  function handleOtp(i, v) {
    if (!/^\d*$/.test(v)) return
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKey(i, e) { if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus() }

  function handleVerify(e) { e.preventDefault(); if (otp.join('').length === 6) onLogin() }

  useEffect(() => () => clearInterval(timer.current), [])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>🎓</div>
          <div>
            <div className={styles.brandName}>SchoolHub</div>
            <div className={styles.brandSub}>Admin Portal</div>
          </div>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleLogin}>
            <h2 className={styles.title}>Sign in to your account</h2>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input className="form-input" type="email" placeholder="admin@school.edu.in" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`}>Continue →</button>
            <div className={styles.mfa}>🔐 MFA verification required on next step</div>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <button type="button" className={styles.backLink} onClick={() => { setStep('email'); setOtp(['','','','','','']) }}>
              ← {email}
            </button>
            <h2 className={styles.title}>Enter verification code</h2>
            <p className={styles.otpDesc}>Sent to your registered email & authenticator app.</p>
            <div className={styles.otpRow}>
              {otp.map((d, i) => (
                <input key={i} ref={el => refs.current[i] = el}
                  className={`${styles.otpBox} ${d ? styles.filled : ''}`}
                  type="tel" inputMode="numeric" maxLength={1}
                  value={d} onChange={e => handleOtp(i, e.target.value)} onKeyDown={e => handleKey(i, e)} />
              ))}
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={otp.join('').length !== 6}>
              Verify & Sign In →
            </button>
            <div className={styles.resend}>
              {resend > 0 ? <span>Resend in {resend}s</span> : <button type="button" className="btn-ghost" onClick={() => { setOtp(['','','','','','']); startTimer() }}>Resend code</button>}
            </div>
          </form>
        )}
      </div>
      <div className={styles.footer}>SchoolHub ERP Platform · Admin Access Only</div>
    </div>
  )
}
