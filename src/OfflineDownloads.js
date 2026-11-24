// src/OfflineDownloads.js  –  V2: Offline content manager
import React, { useState, useEffect } from 'react';
import { offlineAPI } from './services/api';
import { FaTrash, FaMapMarkerAlt, FaWifi, FaDownload } from 'react-icons/fa';

export default function OfflineDownloads({ onBack }) {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [online, setOnline]       = useState(navigator.onLine);

  useEffect(() => {
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    offlineAPI.getDownloads()
      .then(r => { if (r.success) setDownloads(r.data); })
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleRemove = async (id) => {
    await offlineAPI.removeDownload(id);
    setDownloads(d => d.filter(x => x.id !== id));
  };

  // Also show localStorage cached items
  const localKeys = Object.keys(localStorage).filter(k => k.startsWith('misfar_offline_dest_'));
  const localCached = localKeys.map(k => {
    try {
      const d = JSON.parse(localStorage.getItem(k));
      return { localKey: k, name: d?.destination?.name, cached_at: d?.cached_at };
    } catch { return null; }
  }).filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#FAF0E6', paddingBottom: 60 }}>
      <div style={{ background: '#7B1E1E', padding: '20px 24px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>
          ← Back
        </button>
        <h1 style={{ color: '#fff', margin: '12px 0 4px', fontSize: 22 }}>📶 Offline Downloads</h1>
        <p style={{ color: '#D4A77A', margin: 0, fontSize: 14 }}>Content saved for offline use</p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: online ? '#E8F5E9' : '#FFF3E8', border: `1px solid ${online ? '#A5D6A7' : '#FFCC80'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
          <FaWifi color={online ? '#2E7D32' : '#E65100'} />
          <span style={{ fontSize: 13, color: online ? '#2E7D32' : '#E65100', fontWeight: 600 }}>
            {online ? 'You are online — content will sync automatically' : 'You are offline — showing cached content only'}
          </span>
        </div>

        {/* Server-tracked downloads */}
        <h3 style={{ color: '#7B1E1E', marginBottom: 12, fontSize: 15 }}>Saved Destinations</h3>
        {loading ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 30 }}>Loading...</p>
        ) : downloads.filter(d => d.destination_id).length === 0 && localCached.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, border: '1px dashed #ddd' }}>
            <FaDownload size={32} color="#ccc" />
            <p style={{ color: '#999', marginTop: 12 }}>No saved content yet.</p>
            <p style={{ color: '#bbb', fontSize: 13 }}>On any destination page, tap "📥 Download" in the Learn tab to save it for offline use.</p>
          </div>
        ) : (
          <>
            {downloads.filter(d => d.destination_id).map(d => (
              <div key={d.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 28 }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1A1A1A' }}>{d.dest_name || 'Destination'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{d.region} · {d.category}</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Saved {new Date(d.downloaded_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleRemove(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', padding: 8 }}>
                  <FaTrash />
                </button>
              </div>
            ))}
            {localCached.map(item => (
              <div key={item.localKey} style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1A1A1A' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>Cached locally · {item.cached_at ? new Date(item.cached_at).toLocaleDateString() : ''}</div>
                </div>
                <button onClick={() => { localStorage.removeItem(item.localKey); window.location.reload(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', padding: 8 }}>
                  <FaTrash />
                </button>
              </div>
            ))}
          </>
        )}

        {/* Saved Trips */}
        {downloads.filter(d => d.trip_id).length > 0 && (
          <>
            <h3 style={{ color: '#7B1E1E', margin: '24px 0 12px', fontSize: 15 }}>Saved Trips</h3>
            {downloads.filter(d => d.trip_id).map(d => (
              <div key={d.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28 }}>🗺</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{d.trip_title || 'Trip'}</div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>Saved {new Date(d.downloaded_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleRemove(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', padding: 8 }}>
                  <FaTrash />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
