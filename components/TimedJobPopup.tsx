"use client";

import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const THREE_MINUTES_MS = 1 * 60 * 1000;

interface TimedJobPopupProps {
  forceShow?: boolean;
}

export default function TimedJobPopup({ forceShow = false }: TimedJobPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !forceShow) return;

    const stored = localStorage.getItem('timed-popup-shown');
    if (stored) {
      if (Date.now() - parseInt(stored) < FIVE_DAYS_MS) return;
    }

    const timer = setTimeout(() => {
      setShowPopup(true);
      requestAnimationFrame(() => setTimeout(() => setVisible(true), 10));
    }, THREE_MINUTES_MS);

    return () => clearTimeout(timer);
  }, [forceShow]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setShowPopup(false);
      localStorage.setItem('timed-popup-shown', Date.now().toString());
    }, 350);
  };

  if (!showPopup) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,400&family=DM+Sans:wght@400;500;600&display=swap');

        .popup-overlay {
          transition: opacity 0.35s ease;
          opacity: 0;
        }
        .popup-overlay.visible {
          opacity: 1;
        }
        .popup-card {
          transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          transform: translateY(28px) scale(0.96);
        }
        .popup-card.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-inner {
          animation: ticker 14s linear infinite;
          white-space: nowrap;
          display: flex;
        }

        .cta-btn {
          position: relative;
          overflow: hidden;
        }
        .cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.08);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cta-btn:hover::after {
          opacity: 1;
        }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
        }
        .dot-live {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse-dot 1.8s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }

        .close-btn {
          transition: background 0.18s, transform 0.18s;
        }
        .close-btn:hover {
          background: #1a1a1a;
          transform: rotate(90deg);
        }
      `}</style>

      <div
        className={`popup-overlay${visible ? ' visible' : ''} fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6`}
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      >
        <div onClick={handleClose} className="absolute inset-0" />

        <div
          className={`popup-card${visible ? ' visible' : ''} relative w-full max-w-[400px] rounded-[28px] overflow-hidden shadow-2xl`}
          style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Close */}
          <button
            onClick={handleClose}
            className="close-btn absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <X size={14} />
          </button>

          {/* Ticker tape */}
          <div
            style={{
              background: '#18181b',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '9px 0',
              overflow: 'hidden',
            }}
          >
            <div className="ticker-inner" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {Array(8).fill('✦ Applications submitted daily &nbsp;&nbsp;&nbsp;✦ Nigerian jobs only &nbsp;&nbsp;&nbsp;✦ Tailored CVs &nbsp;&nbsp;&nbsp;').map((t, i) => (
                <span key={i} dangerouslySetInnerHTML={{ __html: t }} />
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '36px 32px 28px' }}>
            {/* Badge */}
            <div style={{ marginBottom: 20 }}>
              <span className="pill-badge">
                <span className="dot-live" />
                Now accepting applications
              </span>
            </div>

            {/* Headline */}
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 40,
                lineHeight: 1.05,
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Too Busy to
              <br />
              <em
                style={{
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                Job Hunt?
              </em>
            </h2>

            {/* Sub */}
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14.5,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.45)',
                margin: '0 0 28px',
              }}
            >
              We apply to jobs on your behalf — sourced, tailored, and manually submitted every month — while you focus on life.
            </p>

            {/* CTA */}
            <a
              href="/apply-for-me"
              className="cta-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '16px 20px',
                background: '#ffffff',
                color: '#0a0a0a',
                borderRadius: 16,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              <span>Apply For Me</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  background: '#0a0a0a',
                  borderRadius: 10,
                }}
              >
                <ArrowRight size={15} color="#fff" />
              </span>
            </a>

            {/* Footer trust line */}
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 11.5,
                color: 'rgba(255,255,255,0.2)',
                textAlign: 'center',
                marginTop: 18,
                letterSpacing: '0.01em',
              }}
            >
              Exclusively for Nigerian professionals · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </>
  );
}