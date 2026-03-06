import fs from 'fs';
import path from 'path';
import BackButton from '@/components/BackButton';

export const dynamic = 'force-static';
export const revalidate = 3600; // Refetch every hour just in case

export default async function VersionsPage() {
    // Read the CHANGELOG.md file from the project root
    let changelogText = '';
    try {
        const filePath = path.join(process.cwd(), 'CHANGELOG.md');
        changelogText = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error('Error reading CHANGELOG.md:', error);
        changelogText = 'Error loading release notes.';
    }

    // A simple parser to split the markdown log into discrete version blocks.
    const blocks = [];
    let currentBlock = null;

    // Process line by line
    const lines = changelogText.split('\n');
    for (const line of lines) {
        // Detect a version header: ## [1.9.0] — Date...
        if (line.startsWith('## [')) {
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            currentBlock = {
                title: line.replace(/^##\s+/, ''), // Strip the '## ' part
                content: []
            };
        } else if (currentBlock) {
            // Collect content under that header
            if (line.trim() !== '' || currentBlock.content.length > 0) {
                currentBlock.content.push(line);
            }
        }
    }
    // Push the very last section
    if (currentBlock) {
        blocks.push(currentBlock);
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div className="container fade-in" style={{ padding: '2rem 20px', maxWidth: '800px', margin: '0 auto' }}>
                <BackButton />
                <h1 className="section-title">Versions & Release Notes</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', textAlign: 'center' }}>
                    A history of PinPlaced application updates.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {blocks.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center' }}>
                            <p>No version history available.</p>
                        </div>
                    ) : (
                        blocks.map((block, index) => {
                            // Extract just the version number for the ID link anchor
                            const versionMatch = block.title.match(/\[(.*?)\]/);
                            const versionId = versionMatch ? versionMatch[1] : `version-${index}`;

                            return (
                                <div key={index} id={versionId} className="card" style={{
                                    padding: '2rem',
                                    border: index === 0 ? '1px solid var(--accent)' : '1px solid var(--glass-border)'
                                }}>
                                    <h2 style={{
                                        color: index === 0 ? 'var(--accent)' : 'var(--text-main)',
                                        marginBottom: '1.5rem',
                                        fontSize: '1.4rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        paddingBottom: '0.8rem'
                                    }}>
                                        {block.title}
                                    </h2>

                                    <div style={{
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.6',
                                        fontSize: '0.95rem'
                                    }}>
                                        {block.content.map((line, lineIndex) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return <br key={lineIndex} />;

                                            // Handle Markdown sub-headers (### 🚀 Deployed)
                                            if (trimmed.startsWith('###')) {
                                                return (
                                                    <h3 key={lineIndex} style={{
                                                        color: '#e0e0e0',
                                                        marginTop: '1.5rem',
                                                        marginBottom: '0.8rem',
                                                        fontSize: '1.1rem'
                                                    }}>
                                                        {trimmed.replace(/^###\s+/, '')}
                                                    </h3>
                                                );
                                            }

                                            // Handle unordered list items (- Feature...)
                                            if (trimmed.startsWith('- ')) {
                                                // Handle nested lists based on leading spaces (very rudimentary)
                                                const leadingSpaces = line.match(/^\s*/)[0].length;
                                                const marginLeft = leadingSpaces > 0 ? '1.5rem' : '0.5rem';

                                                // Bold markdown logic
                                                const textWithBold = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                                                return (
                                                    <div
                                                        key={lineIndex}
                                                        style={{
                                                            display: 'flex',
                                                            marginBottom: '0.5rem',
                                                            marginLeft
                                                        }}
                                                    >
                                                        <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>•</span>
                                                        <span dangerouslySetInnerHTML={{ __html: textWithBold }} />
                                                    </div>
                                                );
                                            }

                                            // Regular paragraph text
                                            return <p key={lineIndex} style={{ marginBottom: '0.5rem' }}>{trimmed}</p>;
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
