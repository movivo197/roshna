'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Heart,
  Compass,
  Target,
  Flame,
  Clock,
  RotateCcw,
  Zap,
  Smile,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { faNumber as n, type GrowthData } from '@/lib/growth-data';
import type { Destination } from '@/lib/product';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const QUICK_TOPICS = [
  {
    icon: Zap,
    title: 'شکستن قفل اهمال‌کاری',
    prompt: 'امروز کار مهمی دارم اما مدام شروع کردنش را عقب می‌اندازم و دچار اهمال‌کاری شده‌ام. چطور مغزم را متقاعد کنم شروع کند؟',
  },
  {
    icon: Heart,
    title: 'آرام‌سازی اضطراب و استرس',
    prompt: 'احساس استرس و تپش قلب دارم و فکرهای منفی در سرم می‌چرخند. چه تمرینی برای آرام‌سازی فوری پیشنهاد می‌کنی؟',
  },
  {
    icon: Flame,
    title: 'ساخت عادات پایدار و انضباط',
    prompt: 'می‌خواهم یک روتین صبحگاهی پایدار بسازم اما بعد از چند روز انگیزه‌ام افت می‌کند. راهکار عملی چیست؟',
  },
  {
    icon: Compass,
    title: 'رفع کمال‌گرایی و ترس از اشتباه',
    prompt: 'کمال‌گرایی باعث شده کارهایم را دیر تحویل بدهم یا اصلاً شروع نکنم چون می‌خواهم همه چیز بی‌نقص باشد. چطور نگاه تازه‌ای داشته باشم؟',
  },
];

interface Props {
  data: GrowthData;
  go?: (dest: Destination) => void;
  notify?: (msg: string) => void;
}

export default function AiMentor({ data, go }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `سلام ${data.profile.name || 'دوست من'} عزیز 🌱\nمن مربی هوشمند زندگی و همراه روانشناسی تو در روشنا هستم.\n\nهر زمان که احساس خستگی، اضطراب، بی‌انگیزگی یا سردرگمی کردی، یا برای برنامه‌ریزی و ساخت عاداتت به یک نگاه تخصصی نیاز داشتی، اینجام تا باهم قدم بعدی رو پیدا کنیم.\n\nامروز ذهنت درگیر چه موضوعی است؟`,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('roshna-ai-mentor-chat-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
  }, []);

  // Save chat history
  useEffect(() => {
    try {
      localStorage.setItem('roshna-ai-mentor-chat-v1', JSON.stringify(messages));
    } catch {}
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            name: data.profile.name,
            tasksDone: data.tasks.filter((t) => t.done).length,
            habitsCount: data.habits.length,
            focusMinutes: data.focus.reduce((sum, f) => sum + f.minutes, 0),
          },
        }),
      });

      if (!res.ok) throw new Error('خطا در برقراری ارتباط');
      const json = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: json.reply || 'متوجه پیامت شدم؛ بیایید باهم گام‌به‌گام بررسی کنیم.',
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'ارتباط با سرور مربی با اختلال مواجه شد، اما مهم این است که بدانی احساساتت شنیده می‌شوند. برای لحظه‌ای چند نفس عمیق بکش و به بدنت توجه کن.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (!confirm('آیا تاریخچه گفتگو با مربی پاک شود؟')) return;
    const initial: Message[] = [
      {
        id: 'welcome_new',
        role: 'assistant',
        content: `سلام ${data.profile.name || 'دوست من'} عزیز 🌱 یک شروع تازه! امروز چه کمکی از دست من برایت ساخته است؟`,
        createdAt: new Date().toISOString(),
      },
    ];
    setMessages(initial);
    try {
      localStorage.setItem('roshna-ai-mentor-chat-v1', JSON.stringify(initial));
    } catch {}
  };

  const tasksDoneToday = data.tasks.filter((t) => t.done).length;
  const focusTotalMinutes = data.focus.reduce((acc, f) => acc + f.minutes, 0);

  return (
    <div className="mn-hub-container" dir="rtl">
      {/* Header */}
      <header className="mn-hero-header">
        <div className="mn-hero-info">
          <span className="mn-eyebrow">
            <Sparkles size={16} /> هوش مصنوعی و مربی روانشناسی روشنا
          </span>
          <h1>مربی هوشمند سبک زندگی و خودشناسی</h1>
          <p>
            همراهی دانا برای شنیدن دغدغه‌ها، تحلیل ریشه‌ای اهمال‌کاری و استرس، و ارائه راهکارهای عملی مبتنی بر روانشناسی مثبت‌گرا.
          </p>
        </div>
        <div className="mn-hero-badge">
          <div className="mn-live-pill">
            <span className="mn-pulse-dot" />
            <strong>مربی آنلاین و اختصاصی</strong>
          </div>
          <small>مجهز به مدل هوشمند Gemini</small>
        </div>
      </header>

      {/* User Context Glance Cards */}
      <div className="mn-context-strip">
        <div className="mn-ctx-card">
          <Target size={18} className="mn-ctx-icon gold" />
          <div>
            <small>تسک‌های تکمیل‌شده</small>
            <strong>{n(tasksDoneToday)} کار</strong>
          </div>
        </div>
        <div className="mn-ctx-card">
          <Clock size={18} className="mn-ctx-icon blue" />
          <div>
            <small>مجموع تمرکز عمیق</small>
            <strong>{n(focusTotalMinutes)} دقیقه</strong>
          </div>
        </div>
        <div className="mn-ctx-card">
          <Flame size={18} className="mn-ctx-icon mint" />
          <div>
            <small>عادت‌های فعال</small>
            <strong>{n(data.habits.length)} روتین</strong>
          </div>
        </div>
        <div className="mn-ctx-card">
          <ShieldCheck size={18} className="mn-ctx-icon purple" />
          <div>
            <small>حریم خصوصی</small>
            <strong>۱۰۰٪ محرمانه و امن</strong>
          </div>
        </div>
      </div>

      {/* Chat Area & Quick Prompts */}
      <div className="mn-chat-layout">
        {/* Quick Suggestion Pills */}
        <div className="mn-quick-prompts-bar">
          <span className="mn-quick-title">موضوعات پیشنهادی برای شروع:</span>
          <div className="mn-quick-stack">
            {QUICK_TOPICS.map((topic, i) => {
              const Icon = topic.icon;
              return (
                <button
                  key={i}
                  type="button"
                  className="mn-quick-pill"
                  onClick={() => sendMessage(topic.prompt)}
                  disabled={loading}
                >
                  <Icon size={14} />
                  <span>{topic.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages Stream Card */}
        <div className="mn-messages-card">
          <div className="mn-messages-head">
            <div className="mn-coach-info">
              <Bot size={22} className="mn-coach-avatar" />
              <div>
                <strong>مربی روشنا</strong>
                <small>پاسخ‌دهی هوشمند بر پایه روانشناسی ACT و CBT</small>
              </div>
            </div>
            <button
              type="button"
              className="g-text-btn"
              onClick={clearChat}
              title="پاک‌کردن تاریخچه گفتگو"
            >
              <RotateCcw size={14} /> شروع مجدد گفتگو
            </button>
          </div>

          <div className="mn-messages-body">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`mn-bubble-row ${isAssistant ? 'assistant' : 'user'}`}>
                  <div className="mn-bubble-avatar">
                    {isAssistant ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="mn-bubble-content">
                    <div className="mn-bubble-meta">
                      <strong>{isAssistant ? 'مربی روشنا' : data.profile.name || 'شما'}</strong>
                      <time>
                        {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <div className="mn-bubble-text">
                      {msg.content.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>

                    {/* Proactive In-App Action Links if mentioned in response */}
                    {isAssistant && msg.content.includes('۴-۷-۸') && go && (
                      <button
                        type="button"
                        className="mn-bubble-action-btn"
                        onClick={() => go('gadgets')}
                      >
                        <Sparkles size={14} /> باز کردن گجت تنفس ۴-۷-۸ <ArrowLeft size={14} />
                      </button>
                    )}
                    {isAssistant && msg.content.includes('صندوق توکل') && go && (
                      <button
                        type="button"
                        className="mn-bubble-action-btn"
                        onClick={() => go('gadgets')}
                      >
                        <Sparkles size={14} /> رفتن به صندوق توکل <ArrowLeft size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="mn-bubble-row assistant">
                <div className="mn-bubble-avatar">
                  <Bot size={18} />
                </div>
                <div className="mn-bubble-content loading">
                  <div className="mn-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <small>مربی در حال تامل و نوشتن راهکار برای شماست…</small>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="mn-input-bar"
          >
            <input
              type="text"
              placeholder="دغدغه، سوال یا احساس امروزت را بنویس…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="mn-chat-input"
            />
            <button
              type="submit"
              className="g-btn primary mn-send-btn"
              disabled={!input.trim() || loading}
            >
              <Send size={18} />
              <span>ارسال</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
