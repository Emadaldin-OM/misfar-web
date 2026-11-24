// src/components/ARViewer.js  –  V2: Phase 1 AR Info Overlay (WebAR via GPS)
import React, { useState, useEffect, useRef } from 'react';

export default function ARViewer({ destination, onClose }) {
  const [phase, setPhase]         = useState('init'); // init | loading | active | error | unsupported
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance]   = useState(null);
  const [bearing, setBearing]     = useState(null);
  const videoRef                  = useRef(null);
  const streamRef                 = useRef(null);

  const destLat = parseFloat(destination?.latitude  || destination?.lat);
  const destLng = parseFloat(destination?.longitude || destination?.lng);
  const hasCoords = !isNaN(destLat) && !isNaN(destLng);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('unsupported');
      return;
    }
    startAR();
    return () => stopAR();
  }, []);

  const startAR = async () => {
    setPhase('loading');
    try {
      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Request GPS
      if (navigator.geolocation && hasCoords) {
        navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserCoords({ lat, lng });
            setDistance(calcDistance(lat, lng, destLat, destLng));
            setBearing(calcBearing(lat, lng, destLat, destLng));
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      }

      setPhase('active');
    } catch (err) {
      setPhase('error');
    }
  };

  const stopAR = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // Haversine distance in km
  const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };

  // Bearing in degrees (N=0, E=90)
  const calcBearing = (lat1, lng1, lat2, lng2) => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180)
            - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180 / Math.PI + 360) % 360).toFixed(0);
  };

  const bearingLabel = (deg) => {
    const dirs = ['N','NE','E','SE','S','SW','W','NW','N'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <div style={overlay}>
      {/* Camera feed */}
      <video ref={videoRef} style={videoStyle} autoPlay playsInline muted />

      {/* Close */}
      <button onClick={() => { stopAR(); onClose(); }} style={closeBtn}>✕</button>

      {/* AR Phase Label */}
      <div style={phaseBadge}>📱 AR View — Phase 1: Info Overlay</div>

      {/* States */}
      {phase === 'loading' && (
        <div style={centerMsg}>
          <div style={spinner} />
          <p style={{ color: '#fff', marginTop: 12 }}>Starting camera...</p>
        </div>
      )}

      {phase === 'unsupported' && (
        <div style={centerMsg}>
          <p style={{ color: '#fff', fontSize: 16 }}>📷 Camera not available on this device.</p>
          <p style={{ color: '#ccc', fontSize: 13 }}>AR requires a device with a camera and GPS.</p>
        </div>
      )}

      {phase === 'error' && (
        <div style={centerMsg}>
          <p style={{ color: '#fff', fontSize: 16 }}>⚠ Camera access denied.</p>
          <p style={{ color: '#ccc', fontSize: 13 }}>Please allow camera permissions and try again.</p>
        </div>
      )}

      {/* Active AR Overlay */}
      {phase === 'active' && (
        <>
          {/* Destination Info Panel */}
          <div style={infoPanel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>📍</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{destination.name}</div>
                <div style={{ fontSize: 12, color: '#FFD9B3' }}>{destination.area}, {destination.region}</div>
              </div>
            </div>
            {destination.avg_rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                {'★'.repeat(Math.round(destination.avg_rating))}{'☆'.repeat(5 - Math.round(destination.avg_rating))}
                <span style={{ color: '#FFD9B3', fontSize: 12, marginLeft: 4 }}>{destination.avg_rating}</span>
              </div>
            )}
            {distance && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#ccc' }}>
                📏 {distance} km away {bearing && `· Direction: ${bearingLabel(bearing)} (${bearing}°)`}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 12, color: '#FFD9B3', fontStyle: 'italic' }}>
              Tap "📚 Learn" tab to discover cultural facts about this site
            </div>
          </div>

          {/* Compass arrow */}
          {bearing && (
            <div style={compassWrap}>
              <div style={{ ...compassArrow, transform: `rotate(${bearing}deg)` }}>↑</div>
              <div style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>{bearingLabel(bearing)}</div>
            </div>
          )}

          {/* Crosshair */}
          <div style={crosshair}>
            <div style={crosshairH} />
            <div style={crosshairV} />
          </div>

          {/* Phase 2 teaser */}
          <div style={teaserBar}>
            🚧 Phase 2 (Month 6): Historical 3D reconstruction overlay — see {destination.name} as it looked in its prime
          </div>
        </>
      )}
    </div>
  );
}

// Styles
const overlay    = { position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const videoStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
const closeBtn   = { position: 'absolute', top: 16, right: 16, zIndex: 10001, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 18, cursor: 'pointer' };
const phaseBadge = { position: 'absolute', top: 16, left: 16, zIndex: 10001, background: '#7B1E1E', color: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700 };
const centerMsg  = { position: 'absolute', inset: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner    = { width: 40, height: 40, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };
const infoPanel  = { position: 'absolute', bottom: 80, left: 16, right: 16, zIndex: 10001, background: 'rgba(123,30,30,0.88)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.2)' };
const compassWrap= { position: 'absolute', top: 60, right: 16, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: 10, width: 56, height: 56, justifyContent: 'center' };
const compassArrow={ fontSize: 22, color: '#E8611A', fontWeight: 900, transition: 'transform 0.5s ease' };
const crosshair  = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10000, width: 50, height: 50 };
const crosshairH = { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.5)' };
const crosshairV = { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.5)' };
const teaserBar  = { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10001, background: 'rgba(14,71,161,0.85)', color: '#fff', fontSize: 11, padding: '8px 16px', textAlign: 'center' };
