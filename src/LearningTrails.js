// src/LearningTrails.js  –  V2: Learning Trails — matches original project style
import React, { useState, useEffect } from 'react';
import { educationAPI } from './services/api';
import { FaArrowLeft, FaMapMarkerAlt, FaGraduationCap, FaChevronRight, FaRoute } from 'react-icons/fa';
import './styles/Destinations.css';

const ACCENT = '#e66a1d';
const DARK   = '#111827';
const GRAY   = '#6b7280';

export default function LearningTrails({ onBack, onOpenDestination }) {
  const [trails, setTrails]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    educationAPI.getTrails()
      .then(r => { if (r.success) setTrails(r.data); })
      .finally(() => setLoading(false));
  }, []);

  const openTrail = async (trail) => {
    const r = await educationAPI.getTrail(trail.id);
    if (r.success) setSelected(r.data);
  };

  // ── Trail detail view ─────────────────────────────────────────
  if (selected) return (
    <div style={page}>
      <div style={header}>
        <div style={headerInner}>
          <button onClick={() => setSelected(null)} style={backBtn}>
            <FaArrowLeft style={{ marginRight: 7 }} /> Back to Trails
          </button>
          <h1 style={headerTitle}>{selected.name}</h1>
          {selected.theme && <p style={headerSub}>{selected.theme}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {selected.grade_level && (
              <span style={pill('#1d4ed8', '#eff6ff')}><FaGraduationCap style={{ marginRight: 5 }} />{selected.grade_level}</span>
            )}
            {selected.curriculum_link && (
              <span style={pill('#15803d', '#f0fdf4')}>{selected.curriculum_link}</span>
            )}
          </div>
        </div>
      </div>

      <div style={content}>
        <h3 style={{ color: DARK, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
          Destinations on this Trail
        </h3>
        {(selected.destinations || []).length === 0 ? (
          <p style={{ color: GRAY, textAlign: 'center', padding: 30 }}>
            Destinations are being added to this trail.
          </p>
        ) : (
          selected.destinations.map((dest, i) => (
            <div
              key={dest.id}
              style={destRow}
              onClick={() => onOpenDestination && onOpenDestination(dest)}
            >
              <div style={{ ...stepNum, background: ACCENT }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 15 }}>{dest.name}</div>
                <div style={{ fontSize: 12, color: GRAY, marginTop: 3 }}>
                  <FaMapMarkerAlt style={{ marginRight: 4 }} />
                  {dest.area}, {dest.region}
                </div>
              </div>
              <span style={pill('#e66a1d', '#fff7ed')}>{dest.category}</span>
              <FaChevronRight color="#d1d5db" size={13} style={{ marginLeft: 4 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Trails list view ──────────────────────────────────────────
  return (
    <div style={page}>
      <div style={header}>
        <div style={headerInner}>
          <button onClick={onBack} style={backBtn}>
            <FaArrowLeft style={{ marginRight: 7 }} /> Back
          </button>
          <h1 style={headerTitle}>Learning Trails</h1>
          <p style={headerSub}>Curriculum-linked routes through Oman's heritage</p>
        </div>
      </div>

      <div style={content}>
        {loading ? (
          <p style={{ textAlign: 'center', color: GRAY, padding: 40 }}>Loading trails...</p>
        ) : trails.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <FaRoute size={40} color="#d1d5db" />
            <p style={{ color: GRAY, marginTop: 16 }}>Learning Trails are being prepared. Check back soon.</p>
          </div>
        ) : (
          trails.map((trail, i) => (
            <div key={trail.id} onClick={() => openTrail(trail)} style={trailCard}>
              <div style={{ ...trailAccent, background: ACCENT }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 5 }}>
                  {trail.name}
                </div>
                {trail.theme && (
                  <div style={{ fontSize: 13, color: GRAY, marginBottom: 8 }}>{trail.theme}</div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {trail.grade_level && (
                    <span style={pill('#1d4ed8', '#eff6ff')}><FaGraduationCap style={{ marginRight: 4 }} />{trail.grade_level}</span>
                  )}
                  {trail.curriculum_link && (
                    <span style={pill('#15803d', '#f0fdf4')}>{trail.curriculum_link}</span>
                  )}
                </div>
              </div>
              <FaChevronRight color="#d1d5db" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const page      = { minHeight: '100vh', background: '#f3f4f6', fontFamily: '"Poppins","Inter",system-ui,sans-serif' };
const header    = { background: '#7B1E1E', padding: '24px 60px 28px' };
const headerInner = { maxWidth: 900, margin: '0 auto' };
const headerTitle = { color: '#fff', fontSize: 28, fontWeight: 700, margin: '12px 0 4px' };
const headerSub   = { color: '#fcd9b0', fontSize: 14, margin: 0 };
const backBtn   = { display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const content   = { maxWidth: 900, margin: '0 auto', padding: '28px 60px 60px' };
const destRow   = { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 18px', marginBottom: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s' };
const stepNum   = { minWidth: 34, height: 34, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 };
const trailCard = { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 20px', marginBottom: 14, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' };
const trailAccent = { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 };
const pill = (color, bg) => ({ background: bg, color, border: `1px solid ${color}30`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center' });
