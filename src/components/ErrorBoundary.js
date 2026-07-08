"use client";

import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="card" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    border: '1px dashed #ff6b6b',
                    background: 'rgba(255, 107, 107, 0.05)',
                    color: 'var(--text-main)',
                    margin: '1rem 0'
                }}>
                    <h3 style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>⚠️ Something went wrong</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        {this.props.errorMessage || "This component failed to load. Please refresh the page or try again later."}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
