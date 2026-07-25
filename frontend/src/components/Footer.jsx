import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-zinc-950 border-t border-zinc-800/80 mt-20 py-6 text-center text-xs text-zinc-500 font-mono">
            &copy; {new Date().getFullYear()} MaktabaBora Library System. All rights reserved.
        </footer>
    );
}
