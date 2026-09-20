import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  Droplet, 
  TrafficCone, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  FileCheck2, 
  Users, 
  Shield 
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, isAdmin } = useAuth();

  const primaryCtaDestination = isAuthenticated 
    ? (isAdmin ? '/admin' : '/report') 
    : '/register';

  const civicIssues = [
    {
      title: 'Potholes & Road Cracks',
      desc: 'Report road surface damage, potholes, and broken asphalt causing hazards.',
      icon: AlertTriangle,
      color: '#D97706'
    },
    {
      title: 'Broken Streetlights',
      desc: 'Fix flickering or completely unlit neighborhood lights for pedestrian safety.',
      icon: Lightbulb,
      color: '#CA8A04'
    },
    {
      title: 'Garbage & Waste',
      desc: 'Flag overflowing public dumpsters, illegal dumping, and uncollected waste.',
      icon: Trash2,
      color: '#059669'
    },
    {
      title: 'Water Leakage & Mains',
      desc: 'Report burst pipes, road ponding, and municipal drinking water leakage.',
      icon: Droplet,
      color: '#2563EB'
    },
    {
      title: 'Traffic Signals',
      desc: 'Report stuck lights, power failures, or damaged pedestrian crosswalk signals.',
      icon: TrafficCone,
      color: '#DC2626'
    },
    {
      title: 'Public Infrastructure',
      desc: 'Notify authorities about damaged bus shelters, footpaths, signs, and public railings.',
      icon: Building2,
      color: '#64748B'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '4.5rem 0 4rem 0',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            border: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <Shield size={16} /> Official Community Civic Portal
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '1.25rem'
          }}>
            Report. Track. Improve your community.
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem'
          }}>
            Make your community better by reporting local problems and tracking their progress. 
            Connect directly with municipal public works departments for faster, verifiable resolutions.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={primaryCtaDestination} className="btn btn-primary btn-lg">
              Report an Issue <ArrowRight size={18} />
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-secondary btn-lg">
                Login to Track
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Common Civic Issues You Can Report
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Select from standardized municipal categories to route issues directly to the right department.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {civicIssues.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div key={idx} className="card" style={{ display: 'flex', gap: '1.25rem' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: `${item.color}18`,
                    border: `1px solid ${item.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ItemIcon size={24} color={item.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '4rem 0'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              How CivicFix Works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              A transparent, 3-step digital bridge between citizens and public administration.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                marginBottom: '1rem'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Snap & Submit</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Capture a photo of the defect, specify the street location, and submit your report in 60 seconds.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-pending-bg)',
                color: 'var(--status-pending-text)',
                border: '1px solid var(--status-pending-border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                marginBottom: '1rem'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Receive Tracking ID</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Instantly receive an official tracking reference (e.g. <code>CF-1001</code>) and watch municipal triage.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-resolved-bg)',
                color: 'var(--status-resolved-text)',
                border: '1px solid var(--status-resolved-border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                marginBottom: '1rem'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Verified Resolution</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Authorities update progress from <em>In Progress</em> to <em>Resolved</em> with clear verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
            Ready to improve your neighborhood?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
            Join your neighbors and help city maintenance teams spot and repair local issues faster.
          </p>
          <Link to={primaryCtaDestination} className="btn btn-primary btn-lg">
            Start Reporting Now
          </Link>
        </div>
      </section>

    </div>
  );
}
