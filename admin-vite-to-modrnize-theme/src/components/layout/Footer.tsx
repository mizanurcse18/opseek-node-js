import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border-theme bg-footer-bg shadow-[0_-1px_3px_0_rgba(0,0,0,0.02)] z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-[10px] font-bold uppercase tracking-widest text-text-muted py-4">
        &copy; {year} AdminHub. All rights reserved.
      </div>
    </footer>
  );
}
