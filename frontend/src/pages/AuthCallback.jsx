import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCode } from '../lib/api'

export default function AuthCallback() {
  const [status, setStatus] = useState('Connecting to Canvas...')
  const [error,  setError]  = useState(null)
  const [params] = useSearchParams()
  const nav = useNavigate()

  useEffect(() => {
    const code = params.get('code')
    const err  = params.get('error')

    if (err || !code) {
      setError('Canvas login was cancelled or failed. Please try again.')
      return
    }

    exchangeCode(code)
      .then(({ name }) => {
        setStatus(`Welcome, ${name.split(' ')[0]}! Syncing your courses...`)
        setTimeout(() => nav('/dashboard', { replace: true }), 1000)
      })
      .catch(e => setError('Could not connect: ' + e.message))
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100dvh', gap: 16, padding: 24,
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 40 }}>⚠</div>
          <p style={{ fontSize: 15, color: 'var(--text)', textAlign: 'center', maxWidth: 280 }}>{error}</p>
          <button
            onClick={() => nav('/connect', { replace: true })}
            style={{
              padding: '11px 28px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid var(--canvas-light)',
            borderTopColor: 'var(--canvas-color)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>{status}</p>
        </>
      )}
    </div>
  )
}
