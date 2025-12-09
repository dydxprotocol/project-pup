export default function GlobalBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 h-[36rem] z-0"
      style={{
        top: '5rem',
        background: 'linear-gradient(to bottom, rgba(77, 65, 147, 0), rgba(131, 110, 249, 1), rgba(77, 65, 147, 0))',
      }}
    />
  );
}

