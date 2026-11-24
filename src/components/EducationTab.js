// src/components/EducationTab.js  –  V2: Cultural learning tab inside DestinationDetails
import React, { useState, useEffect } from 'react';
import { educationAPI, offlineAPI } from '../services/api';
import { FaBook, FaLandmark, FaUserGraduate, FaMedal, FaDownload, FaCheck } from 'react-icons/fa';

const BADGE_META = {
  bronze_explorer:     { label: 'Bronze Explorer',       desc: 'Reviewed 1 destination' },
  silver_historian:    { label: 'Silver Historian',       desc: 'Reviewed 5 destinations' },
  gold_guardian:       { label: 'Gold Heritage Guardian', desc: 'Reviewed 10 destinations' },
  platinum_ambassador: { label: 'Platinum Ambassador',    desc: 'Reviewed 20 destinations' },
};

export default function EducationTab({ destinationId, destinationName }) {
  const [edu, setEdu]               = useState(null);
  const [badges, setBadges]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      educationAPI.getForDestination(destinationId),
      educationAPI.getMyBadges().catch(() => ({ success: false, data: [] })),
    ]).then(([eduRes, badgeRes]) => {
      if (!mounted) return;
      if (eduRes.success) setEdu(eduRes.data);
      if (badgeRes.success) setBadges(badgeRes.data || []);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [destinationId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await offlineAPI.downloadDestination(destinationId);
      if (res.success) {
        localStorage.setItem(`misfar_offline_dest_${destinationId}`, JSON.stringify(res.data));
        setDownloaded(true);
      }
    } catch { /* silent fail */ }
    setDownloading(false);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
      Loading educational content...
    </div>
  );

  return (
    <div style={{ padding: '16px 0' }}>

      {/* Save for offline */}
      <div style={styles.offlineBar}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Save this destination for offline use</span>
        <button
          onClick={handleDownload}
          disabled={downloaded || downloading}
          style={{ ...styles.dlBtn, background: downloaded ? '#16a34a' : '#e66a1d' }}
        >
          {downloaded
            ? <><FaCheck style={{ marginRight: 5 }} /> Saved</>
            : downloading
            ? 'Saving...'
            : <><FaDownload style={{ marginRight: 5 }} /> Download</>
          }
        </button>
      </div>

      {/* Heritage Badges */}
      {badges.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}><FaMedal color="#e66a1d" style={{ marginRight: 7 }} />Your Heritage Badges</h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {badges.map(b => {
              const meta = BADGE_META[b.badge_type] || { label: b.badge_type, desc: '' };
              return (
                <div key={b.badge_type} style={styles.badge}>
                  <FaMedal size={22} color="#e66a1d" />
                  <span style={styles.badgeLabel}>{meta.label}</span>
                  <span style={styles.badgeDesc}>{meta.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No content yet */}
      {!edu ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <FaBook size={32} style={{ marginBottom: 12 }} />
          <p>Educational content for {destinationName} is being prepared.</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Our team is working with the Ministry of Heritage to document this destination.</p>
        </div>
      ) : (
        <>
          {/* Did You Know */}
          {edu.fun_fact && (
            <div style={styles.didYouKnow}>
              <div>
                <strong style={{ color: '#7B1E1E', display: 'block', marginBottom: 6, fontSize: 14 }}>Did You Know?</strong>
                <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.7 }}>{edu.fun_fact}</p>
              </div>
            </div>
          )}

          {/* Cultural facts */}
          {edu.cultural_facts?.length > 0 && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}><FaLandmark color="#e66a1d" style={{ marginRight: 7 }} />Cultural Facts</h4>
              {edu.cultural_facts.map((fact, i) => (
                <div key={i} style={styles.factItem}>
                  <span style={styles.factNum}>{i + 1}</span>
                  <p style={styles.factText}>{fact}</p>
                </div>
              ))}
            </div>
          )}

          {/* Historical note */}
          {edu.historical_note && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Historical Background</h4>
              <div style={styles.historyBox}>
                <p style={{ margin: 0, color: '#374151', lineHeight: 1.8, fontSize: 14 }}>{edu.historical_note}</p>
              </div>
            </div>
          )}

          {/* Notable figure */}
          {edu.notable_figure && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}><FaUserGraduate color="#e66a1d" style={{ marginRight: 7 }} />Notable Figure</h4>
              <div style={styles.historyBox}>
                <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.6 }}>{edu.notable_figure}</p>
              </div>
            </div>
          )}

          {/* Curriculum tags */}
          {edu.curriculum_tags?.length > 0 && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>School Curriculum Links</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {edu.curriculum_tags.map((tag, i) => (
                  <span key={i} style={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Badge progress hint */}
      <div style={styles.hint}>
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
          Write approved reviews to earn Heritage Badges: Bronze (1) › Silver (5) › Gold (10) › Platinum (20)
        </p>
      </div>
    </div>
  );
}

const styles = {
  offlineBar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', marginBottom: 20 },
  dlBtn:       { display: 'flex', alignItems: 'center', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  section:     { marginBottom: 22 },
  sectionTitle:{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center' },
  didYouKnow:  { background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '4px solid #e66a1d', borderRadius: 10, padding: '14px 16px', marginBottom: 22 },
  factItem:    { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  factNum:     { minWidth: 26, height: 26, background: '#e66a1d', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  factText:    { margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.6 },
  historyBox:  { background: '#f9fafb', border: '1px solid #e5e7eb', borderLeft: '4px solid #9B2335', borderRadius: 8, padding: '14px 16px' },
  badge:       { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 16px', minWidth: 110, textAlign: 'center' },
  badgeLabel:  { fontSize: 11, fontWeight: 700, color: '#7B1E1E', marginTop: 6 },
  badgeDesc:   { fontSize: 10, color: '#9ca3af', marginTop: 3 },
  tag:         { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 },
  hint:        { background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginTop: 10 },
};
