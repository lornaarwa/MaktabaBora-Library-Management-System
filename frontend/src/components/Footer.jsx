import React from 'react';

export default function Footer() {
    return (
        <footer className="mt-20 py-6 text-center caption" style={{ borderTop: '1px solid var(--lightest-gray)', backgroundColor: 'var(--white)' }}>
            &copy; {new Date().getFullYear()} MaktabaBora Library System. All rights reserved.
        </footer>
    );
}
