/**
 * Toast Notification Component
 * Shows temporary success/error messages
 */

import { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';

export default function Toast({ 
  message, 
  type = 'success', // 'success', 'error', 'info'
  onClose, 
  duration = 4000 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      onClose?.();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: '#d1fae5',
    error: '#fee2e2',
    info: '#dbeafe'
  }[type];

  const textColor = {
    success: '#065f46',
    error: '#7f1d1d',
    info: '#1e40af'
  }[type];

  const borderColor = {
    success: '#6ee7b7',
    error: '#fca5a5',
    info: '#93c5fd'
  }[type];

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: bgColor,
      color: textColor,
      padding: '15px 20px',
      borderRadius: '6px',
      border: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-in-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <span>{message}</span>
      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: textColor,
          padding: '0',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <MdClose size={20} />
      </button>
    </div>
  );
}
