'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Users, ShoppingCart, Zap, Brain, Ghost,
  MessageSquare, TrendingUp, BarChart3, Clock, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import './dashboard.css';

interface DashboardData {
  sessions: { activeSessions: number; totalMessages: number; moodDistribution: Record<string, number> };
  telemetry: { totalRequests: number; successfulRequests: number; failedRequests: number; avgResponseTimeMs: number; lastResponseTimeMs: number; circuitBreakerOpen: boolean };
  ghostCart: { activeSessions: number; totalPredictions: number };
}

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
}

const MOOD_COLORS: Record<string, string> = {
  neutral: '#8b5cf6',
  warm: '#f59e0b',
  excited: '#ec4899',
  urgent: '#ef4444',
  romantic: '#f472b6',
  calm: '#14b8a6',
};

const MOOD_LABELS: Record<string, string> = {
  neutral: 'Neutral',
  warm: 'Warm',
  excited: 'Excited',
  urgent: 'Urgent',
  romantic: 'Romantic',
  calm: 'Calm',
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Dashboard API not available — use static data
      setData({
        sessions: { activeSessions: 0, totalMessages: 0, moodDistribution: { neutral: 0 } },
        telemetry: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgResponseTimeMs: 0, lastResponseTimeMs: 0, circuitBreakerOpen: false },
        ghostCart: { activeSessions: 0, totalPredictions: 0 },
      });
    }
    setLastRefresh(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!mounted) return null;

  const sessions = data?.sessions ?? { activeSessions: 0, totalMessages: 0, moodDistribution: {} };
  const telemetry = data?.telemetry ?? { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgResponseTimeMs: 0, lastResponseTimeMs: 0, circuitBreakerOpen: false };
  const ghostCart = data?.ghostCart ?? { activeSessions: 0, totalPredictions: 0 };
  const successRate = telemetry.totalRequests > 0 ? Math.round((telemetry.successfulRequests / telemetry.totalRequests) * 100) : 100;

  const moodEntries = Object.entries(sessions.moodDistribution || {});
  const totalMoodSessions = moodEntries.reduce((s, [, v]) => s + v, 0) || 1;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }
    }),
  };

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <Link href="/" className="dash-back">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="dash-title">KASA Telemetry</h1>
            <p className="dash-subtitle">Real-time AI shopping intelligence</p>
          </div>
        </div>
        <div className="dash-header-right">
          <div className="dash-live-dot" />
          <span className="dash-live-text">Live</span>
          {lastRefresh && <span className="dash-refresh-time">{lastRefresh}</span>}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="dash-metrics">
        <motion.div className="dash-card dash-card-primary" custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <div className="dash-card-icon"><Users size={20} /></div>
          <div className="dash-card-content">
            <span className="dash-card-label">Active Sessions</span>
            <span className="dash-card-value"><AnimatedCounter value={sessions.activeSessions} /></span>
          </div>
        </motion.div>

        <motion.div className="dash-card" custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <div className="dash-card-icon"><MessageSquare size={20} /></div>
          <div className="dash-card-content">
            <span className="dash-card-label">Total Messages</span>
            <span className="dash-card-value"><AnimatedCounter value={sessions.totalMessages} /></span>
          </div>
        </motion.div>

        <motion.div className="dash-card" custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <div className="dash-card-icon"><Zap size={20} /></div>
          <div className="dash-card-content">
            <span className="dash-card-label">MCP Requests</span>
            <span className="dash-card-value"><AnimatedCounter value={telemetry.totalRequests} /></span>
          </div>
        </motion.div>

        <motion.div className="dash-card" custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <div className="dash-card-icon"><Clock size={20} /></div>
          <div className="dash-card-content">
            <span className="dash-card-label">Avg Response</span>
            <span className="dash-card-value"><AnimatedCounter value={telemetry.avgResponseTimeMs} />ms</span>
          </div>
        </motion.div>

        <motion.div className="dash-card" custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <div className="dash-card-icon"><Ghost size={20} /></div>
          <div className="dash-card-content">
            <span className="dash-card-label">Ghost Predictions</span>
            <span className="dash-card-value"><AnimatedCounter value={ghostCart.totalPredictions} /></span>
          </div>
        </motion.div>

        <motion.div className="dash-card" custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <div className="dash-card-icon" style={{ color: successRate >= 95 ? 'var(--kasa-success)' : 'var(--kasa-warning)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="dash-card-content">
            <span className="dash-card-label">Success Rate</span>
            <span className="dash-card-value">{successRate}%</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom panels */}
      <div className="dash-panels">
        {/* Mood Distribution */}
        <motion.div className="dash-panel" custom={6} variants={cardVariants} initial="hidden" animate="visible">
          <h3 className="dash-panel-title"><Brain size={16} /> Mood Distribution</h3>
          <div className="dash-mood-bars">
            {moodEntries.length > 0 ? moodEntries.map(([mood, count]) => (
              <div key={mood} className="dash-mood-row">
                <span className="dash-mood-label">{MOOD_LABELS[mood] || mood}</span>
                <div className="dash-mood-bar-bg">
                  <motion.div
                    className="dash-mood-bar-fill"
                    style={{ background: MOOD_COLORS[mood] || '#8b5cf6' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / totalMoodSessions) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="dash-mood-count">{count}</span>
              </div>
            )) : (
              <p style={{ color: 'var(--kasa-text-3)', fontSize: '13px' }}>No mood data yet. Start chatting!</p>
            )}
          </div>
        </motion.div>

        {/* MCP Health */}
        <motion.div className="dash-panel" custom={7} variants={cardVariants} initial="hidden" animate="visible">
          <h3 className="dash-panel-title"><Activity size={16} /> MCP Health</h3>
          <div className="dash-health-grid">
            <div className="dash-health-item">
              <span className="dash-health-label">Circuit Breaker</span>
              <span className={`dash-health-status ${telemetry.circuitBreakerOpen ? 'open' : 'closed'}`}>
                {telemetry.circuitBreakerOpen ? '⚠️ OPEN' : '✅ Closed'}
              </span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Successful</span>
              <span className="dash-health-value" style={{ color: 'var(--kasa-success)' }}>{telemetry.successfulRequests}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Failed</span>
              <span className="dash-health-value" style={{ color: telemetry.failedRequests > 0 ? 'var(--kasa-error)' : 'var(--kasa-text-3)' }}>{telemetry.failedRequests}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Last Response</span>
              <span className="dash-health-value">{telemetry.lastResponseTimeMs}ms</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Ghost Cart Sessions</span>
              <span className="dash-health-value">{ghostCart.activeSessions}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
