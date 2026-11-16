import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { RelationshipMetricsSnapshot, RadarScores, AiInsightRecord } from '../types';
import { useCouple } from '../context/CoupleContext';

interface DynamicsProps {
  coupleId: string;
}

export const RelationshipDynamics: React.FC<DynamicsProps> = ({ coupleId }) => {
  const [period, setPeriod] = useState<'1m' | '3m' | '6m'>('1m');
  const [data, setData] = useState<RelationshipMetricsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AiInsightRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { coupleProfile } = useCouple();

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/analytics/trends/${coupleId}?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(Array.isArray(json) ? json : json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        setLoading(false);
      }

      try {
        const iRes = await apiFetch(`/api/analytics/insights/${coupleId}`);
        if (iRes.ok) {
          const iJson = await iRes.json();
          setInsights(Array.isArray(iJson) ? iJson : iJson.insights || iJson.data || []);
        }
      } catch (e) { console.error(e); }
    };
    if (coupleId) fetchTrends();
  }, [coupleId, period]);

  // Format data for Recharts
  const chartData = data.map(d => ({
    date: d.metricDate.substring(5).replace('-', '.'), // MM.DD
    Доверие: d.radarScores.trust,
    Общение: d.radarScores.communication,
    Страсть: d.radarScores.passion,
    Ценности: d.radarScores.sharedValues,
    Забота: d.radarScores.care,
    Быт: d.radarScores.dailyLife,
  }));

  // Deltas calculation
  const getDeltas = () => {
    if (data.length < 2) return [];
    
    const first = data[0].radarScores;
    const last = data[data.length - 1].radarScores;
    
    const spheres = [
      { key: 'trust', label: 'Доверие', start: first.trust, end: last.trust },
      { key: 'communication', label: 'Общение', start: first.communication, end: last.communication },
      { key: 'passion', label: 'Страсть', start: first.passion, end: last.passion },
      { key: 'sharedValues', label: 'Ценности', start: first.sharedValues, end: last.sharedValues },
      { key: 'care', label: 'Забота', start: first.care, end: last.care },
      { key: 'dailyLife', label: 'Быт', start: first.dailyLife, end: last.dailyLife }
    ];

    return spheres.map(s => {
      const delta = s.end - s.start;
      return { ...s, delta };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)); // Biggest changes first
  };

  const deltas = getDeltas().slice(0, 3); // Top 3 biggest changes

  return (
    <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-3xl p-5 shadow-sm space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[var(--text)]">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Динамика отношений</h3>
            <p className="text-xs text-[var(--text-2)]">Анализ изменений ваших метрик</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--divider)]">
          {(['1m', '3m', '6m'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p 
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm' 
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              {p === '1m' ? '1 мес' : p === '3m' ? '3 мес' : '6 мес'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[var(--text-2)]">
          <div className="animate-pulse flex items-center gap-2">
            <Clock className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Анализируем данные...</span>
          </div>
        </div>
      ) : chartData.length < 2 ? (
        <div className="h-40 flex items-center justify-center text-center bg-[var(--surface-2)] rounded-2xl border border-dashed border-[var(--divider)]">
          <p className="text-sm text-[var(--text-2)] px-4">
            Недостаточно данных для графика.<br/>Используйте приложение несколько дней.
          </p>
        </div>
      ) : (
        <>
          <div className="h-64 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-2)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-2)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--divider)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                <Line type="monotone" dataKey="Доверие" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Общение" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Страсть" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Ценности" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Забота" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Быт" stroke="#64748b" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          

      {/* AI Insight Section */}
      <div className="border-t border-[var(--divider)] pt-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-extrabold text-[var(--text)]">Еженедельный анализ</h4>
          <button 
            onClick={async () => {
              setIsGenerating(true);
              try {
                const res = await apiFetch('/api/analytics/insights/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    coupleId, 
                    p1Name: coupleProfile?.partner1.name || 'Партнёр 1', 
                    p2Name: coupleProfile?.partner2.name || 'Партнёр 2' 
                  })
                });
                if (res.ok) {
                  const genJson = await res.json();
                  const newInsightRes = await apiFetch(`/api/analytics/insights/${coupleId}`);
                  const newInsightJson = await newInsightRes.json();
                  const fetched = Array.isArray(newInsightJson)
                    ? newInsightJson
                    : newInsightJson.insights || newInsightJson.data || [];
                  if (fetched.length > 0) {
                    setInsights(fetched);
                  } else if (genJson?.insight?.content) {
                    setInsights([{
                      id: `local-${Date.now()}`,
                      coupleId,
                      type: genJson.insight.type || 'weekly',
                      content: genJson.insight.content,
                      periodStart: genJson.insight.periodStart || '',
                      periodEnd: genJson.insight.periodEnd || '',
                      createdAt: new Date().toISOString(),
                    }]);
                  }
                }
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 font-bold text-xs hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isGenerating ? 'Анализирую...' : 'Сгенерировать отчёт'}
          </button>
        </div>

        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.slice(0, 1).map((insight) => (
              <div key={insight.id} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                <p className="text-sm text-[var(--text)] leading-relaxed font-medium mb-3">
                  {insight.content.weekSummary}
                </p>
                
                {insight.content.riskZones && insight.content.riskZones.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-amber-600 block mb-1">Зоны внимания:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {insight.content.riskZones.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-100/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 text-[10px] font-semibold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white dark:bg-[var(--surface)] p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-3">
                  <span className="text-xs font-bold text-indigo-600 block mb-1">Рекомендация на неделю:</span>
                  <p className="text-xs text-[var(--text-2)]">{insight.content.recommendation}</p>
                </div>

                <div className="bg-white dark:bg-[var(--surface)] p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <span className="text-xs font-bold text-indigo-600 block mb-1">Вопрос для обсуждения:</span>
                  <p className="text-xs text-[var(--text-2)] italic">"{insight.content.conversationStarter}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-[var(--surface-2)] rounded-2xl border border-dashed border-[var(--divider)]">
            <p className="text-xs text-[var(--text-2)]">Пока нет сгенерированных отчётов. Нажмите кнопку выше, чтобы Сова проанализировала вашу динамику за неделю.</p>
          </div>
        )}
      </div>

  
          {/* Key Changes Section Orig */}
          {deltas.length > 0 && (
            <div className="border-t border-[var(--divider)] pt-4">
              <h4 className="text-xs font-bold text-[var(--text-2)] mb-3">Ключевые изменения за период</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {deltas.map(d => {
                  const isPositive = d.delta > 0;
                  const isNeutral = d.delta === 0;
                  return (
                    <div key={d.key} className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--divider)] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text)]">{d.label}</span>
                      <div className={`flex items-center gap-1 font-mono text-sm font-bold ${
                        isPositive ? 'text-emerald-500' : isNeutral ? 'text-[var(--text-2)]' : 'text-amber-500'
                      }`}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : isNeutral ? <Minus className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isPositive ? '+' : ''}{Math.round(d.delta)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
