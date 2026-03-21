export function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Icon: lime green rounded square with CS */}
      <div
        style={{
          width: 32,
          height: 32,
          background: '#bef264',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: '"IBM Plex Mono"', fontWeight: 700, fontSize: 13, color: '#08090d', letterSpacing: '-0.5px' }}>
          CS
        </span>
      </div>
      {/* Wordmark */}
      <span style={{ fontFamily: '"DM Sans"', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>
        <span style={{ color: '#e4e8f2' }}>Court</span>
        <span style={{ color: '#bef264' }}>Side</span>
      </span>
      {/* Badge */}
      <span style={{
        background: '#1e222e',
        border: '1px solid #252a38',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 9,
        fontWeight: 700,
        color: '#949cb4',
        letterSpacing: '0.08em',
        fontFamily: '"DM Sans"',
      }}>
        TENNIS
      </span>
    </div>
  )
}
