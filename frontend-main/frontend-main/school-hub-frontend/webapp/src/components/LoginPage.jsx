import { useState, useRef, useEffect } from 'react'
import { lookupByPhone } from '../api/parent'
import styles from './LoginPage.module.css'

export default function LoginPage({ onLogin }) {
  const [step, setStep] = useState('mobile') // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  // Guardians fetched during the OTP step — passed to App on verify
  const pendingGuardians = useRef([])
  const otpRefs = useRef([])
  const timerRef = useRef(null)

  function startResendTimer() {
    setResendTimer(30)
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    if (mobile.length !== 10) return
    setLoading(true)
    setPhoneError('')
    try {
      const guardians = await lookupByPhone(mobile)
      if (!guardians || guardians.length === 0) {
        setPhoneError('No account found for this number. Please contact the school.')
        setLoading(false)
        return
      }
      pendingGuardians.current = guardians
      setStep('otp')
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      // BUG-017: an HTTP error (incl. the Vite proxy's 5xx when a backend is down) vs. no network at all
      setPhoneError(err.status
        ? 'Something went wrong on our side. Please try again later.'
        : 'Unable to reach server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleVerify(e) {
    e.preventDefault()
    if (otp.join('').length === 6) {
      // OTP verification is a UI shell for now — any 6-digit code signs in
      onLogin(pendingGuardians.current)
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setOtp(['', '', '', '', '', ''])
    startResendTimer()
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <div className={styles.page}>
      <div className={styles.circle1} />
      <div className={styles.circle2} />

      <div className={styles.content}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>🎓</div>
          <h2 className={styles.logoName}>SchoolHub</h2>
          <p className={styles.logoSub}>Parent Portal</p>
        </div>

        {step === 'mobile' ? (
          <form className={styles.form} onSubmit={handleSendOtp}>
            <div className={styles.stepLabel}>Step 1 of 2</div>
            <h3 className={styles.stepTitle}>Enter your mobile number</h3>
            <p className={styles.stepDesc}>
              We'll send a 6-digit OTP to verify your identity.
            </p>

            <div className={styles.mobileRow}>
              <div className={styles.countryCode}>
                <span className={styles.flag}>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                className={styles.mobileInput}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="98765 43210"
                value={mobile}
                onChange={e => {
                  setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                  setPhoneError('')
                }}
                autoFocus
                required
              />
            </div>

            {phoneError && (
              <div style={{
                color: '#e53e3e', fontSize: 13, marginTop: -4, marginBottom: 4,
                background: '#fff5f5', border: '1px solid #fed7d7',
                borderRadius: 8, padding: '8px 12px', lineHeight: 1.4
              }}>
                {phoneError}
              </div>
            )}

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={mobile.length !== 10 || loading}
            >
              {loading ? 'Checking…' : 'Send OTP →'}
            </button>

            <p className={styles.footer}>
              Protected with MFA · End-to-end encrypted
            </p>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleVerify}>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => { setStep('mobile'); setOtp(['','','','','','']) }}
            >
              ← +91 {mobile.slice(0,5)} {mobile.slice(5)}
            </button>

            <div className={styles.stepLabel}>Step 2 of 2</div>
            <h3 className={styles.stepTitle}>Enter OTP</h3>
            <p className={styles.stepDesc}>
              Sent to +91 {mobile.slice(0,5)}&nbsp;{mobile.slice(5)}
            </p>

            <div className={styles.otpRow}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (otpRefs.current[i] = el)}
                  className={`${styles.otpBox} ${digit ? styles.otpFilled : ''}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={otp.join('').length !== 6}
            >
              Verify & Sign In →
            </button>

            <div className={styles.resendRow}>
              {resendTimer > 0 ? (
                <span className={styles.resendTimer}>
                  Resend OTP in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={handleResend}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <p className={styles.footer}>
              Protected with MFA · End-to-end encrypted
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
