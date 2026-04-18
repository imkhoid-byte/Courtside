export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Icon: pink/purple gradient square with PP */}
      <div style={{
        width: 32, height: 32,
        background: 'linear-gradient(135deg, #f472b6, #a855f7)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(244,114,182,0.35)',
      }}>
        <span style={{ fontFamily: '"IBM Plex Mono"', fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: '-0.5px' }}>
          PP
        </span>
      </div>
      {/* Wordmark: Padel (white) + Party (gradient) */}
      <span style={{ fontFamily: '"DM Sans"', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>
        <span style={{ color: '#e4e8f2' }}>Padel</span>
        <span style={{
          background: 'linear-gradient(135deg, #f472b6, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Party</span>
      </span>
      {/* Badge */}
      <span style={{
        background: 'rgba(244,114,182,0.08)',
        border: '1px solid rgba(244,114,182,0.2)',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 11,
        fontWeight: 700,
        color: '#f472b6',
        letterSpacing: '0.04em',
        fontFamily: '"DM Sans"',
      }}>
        🎉
      </span>
    </div>
  )
}
