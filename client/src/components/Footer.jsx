import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={20} color="var(--primary)" />
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>CivicFix</span>
          <span style={{ color: 'var(--text-subtle)' }}>—</span>
          <span>Report. Track. Improve your community.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span>Empowering transparent municipal public services</span>
        </div>
      </div>
    </footer>
  );
}
