import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-900 mt-20 py-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MaktabaBora. All rights reserved.
        </footer>
    );
}
