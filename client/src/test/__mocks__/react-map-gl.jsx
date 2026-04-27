// Stub for react-map-gl/maplibre in the happy-dom test environment.
// WebGL is not available in jsdom/happy-dom, so we render simple
// placeholder divs instead of real map canvases.
import React from 'react';

export default function Map({ children, onClick, style }) {
  return (
    <div data-testid="map" style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export function Marker({ children, longitude, latitude }) {
  return (
    <div data-testid="map-marker" data-lng={longitude} data-lat={latitude}>
      {children}
    </div>
  );
}

export function Popup({ children, onClose }) {
  return (
    <div data-testid="map-popup">
      {children}
      <button data-testid="map-popup-close" onClick={onClose} />
    </div>
  );
}
