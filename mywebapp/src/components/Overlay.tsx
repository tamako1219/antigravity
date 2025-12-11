
const Overlay = () => {
    return (
        <div style={{
            width: '100%',
            /* Removed absolute positioning as it's now inside Scroll html */
        }}>
            {/* Hero Section */}
            <section style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <h1 style={{
                    fontSize: '5rem',
                    marginBottom: '1rem',
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(0, 243, 255, 0.3)'
                }}>
                    ANTIGRAVITY
                </h1>
                <p style={{
                    fontSize: '1.5rem',
                    maxWidth: '600px',
                    marginBottom: '2rem',
                    color: '#ccc'
                }}>
                    デジタルインタラクションの未来を体験しよう。
                </p>
                <button style={{
                    pointerEvents: 'auto',
                    padding: '1rem 3rem',
                    fontSize: '1.2rem',
                    background: 'transparent',
                    border: '2px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    borderRadius: '50px',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary)';
                        e.currentTarget.style.color = '#000';
                        e.currentTarget.style.boxShadow = '0 0 30px var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    ワールドへ
                </button>
            </section>

            {/* Features Section */}
            <section style={{
                minHeight: '100vh',
                padding: '4rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center', /* Center vertically */
            }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '4rem' }}>特徴</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    width: '100%',
                    maxWidth: '1200px'
                }}>
                    {[
                        { title: '没入型 3D', desc: '完全な3D環境の統合。' },
                        { title: 'インタラクティブ', desc: 'リアルタイムなキャラクター操作。' },
                        { title: 'モダンデザイン', desc: '洗練された近未来的な美学。' }
                    ].map((feature, index) => (
                        <div key={index} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            padding: '2rem',
                            borderRadius: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            pointerEvents: 'auto'
                        }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Section (Extra space for scroll) */}
            <section style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>© 2025 Antigravity Project</p>
            </section>
        </div>
    );
};

export default Overlay;
