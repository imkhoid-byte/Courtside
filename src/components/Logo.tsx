export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {/* Icon: violet-to-cyan gradient with PP monogram */}
      <div style={{
        width: 30, height: 30,
        background: 'linear-gradient(135deg, #7c3aed, #38bdf8)',
        borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
      }}>
        <span style={{ fontFamily: '"IBM Plex Mono"', fontWeight: 700, fontSize: 11, color: '#fff', letterSpacing: '-0.5px' }}>
          PP
        </span>
      </div>

      {/* Wordmark */}
      <span style={{ fontFamily: '"DM Sans"', fontWeight: 800, fontSize: 17, letterSpacing: '-0.4px', lineHeight: 1 }}>
        <span style={{ color: '#eeeeff' }}>Padel</span>
        <span style={{ color: '#a78bfa' }}>Party</span>
      </span>
    </div>
  )
}
