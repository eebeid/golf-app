import { getData } from '@/lib/data';

export default async function FoodPage() {
    const food = await getData('food');

    return (
        <div className="fade-in">
            <h1 className="section-title">Dining & Menu</h1>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {food.map((section) => (
                    <div key={section.category} style={{ marginBottom: '4rem' }}>
                        <h2 style={{
                            color: 'var(--accent)',
                            borderBottom: '1px solid var(--accent)',
                            paddingBottom: '0.5rem',
                            marginBottom: '2rem',
                            fontSize: '1.8rem'
                        }}>{section.category}</h2>

                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {section.items.map((item) => (
                                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '2rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.desc}</p>
                                    </div>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent)' }}>{item.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
