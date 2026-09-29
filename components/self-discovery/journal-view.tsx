'use client';

import { useState } from 'react';
import {
  BookOpen, Feather, Search, Star, Trash2, Edit3,
  Calendar, Check, X, Plus, Filter, Heart
} from 'lucide-react';
import type { JournalEntry, EmotionId } from '@/lib/self-discovery/state';
import { EMOTIONS } from '@/lib/self-discovery/content';

interface JournalViewProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  onDeleteEntry?: (id: string) => void;
}

export default function JournalView({
  entries,
  onSaveEntry,
  onDeleteEntry,
}: JournalViewProps) {
  const [search, setSearch] = useState('');
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPrompt, setNewPrompt] = useState('تأمل آزاد');
  const [newEmotion, setNewEmotion] = useState<EmotionId | undefined>(undefined);

  const filteredEntries = entries.filter(e => {
    const matchSearch =
      e.text.includes(search) || (e.prompt && e.prompt.includes(search));
    const matchEmotion =
      selectedEmotionFilter === 'all' || e.emotion === selectedEmotionFilter;
    return matchSearch && matchEmotion;
  });

  function handleSubmitNew() {
    if (!newText.trim()) return;
    onSaveEntry({
      date: new Date().toISOString().slice(0, 10),
      prompt: newPrompt.trim() || 'یادداشت آزاد درون',
      text: newText.trim(),
      emotion: newEmotion,
      favorite: false,
    });
    setNewText('');
    setIsAddingNew(false);
  }

  return (
    <div className="sd-journal-root" dir="rtl">
      {/* Header */}
      <div className="sd-journal-header">
        <div>
          <span className="sd-pill-gold"><BookOpen size={14} /> تأملات و خلوت درون</span>
          <h2>دفتر درون ۲.۰</h2>
          <p>تمامی تأملات، پاسخ‌ها به سؤالات عمیق و حال‌های ثبت‌شده شما در فضایی امن و خصوصی روی این دستگاه.</p>
        </div>
        <button
          className="sd-btn sd-btn-gold"
          onClick={() => setIsAddingNew(true)}
        >
          <Plus size={16} /> نگارش یادداشت جدید
        </button>
      </div>

      {/* Adding Modal / Form */}
      {isAddingNew && (
        <div className="sd-journal-form-card">
          <div className="sd-jform-head">
            <h3><Feather size={18} /> ثبت یادداشت یا تأمل جدید</h3>
            <button className="sd-icon-btn" onClick={() => setIsAddingNew(false)}>
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            className="sd-input"
            placeholder="موضوع یا پرسش تأمل (اختیاری)"
            value={newPrompt}
            onChange={e => setNewPrompt(e.target.value)}
          />

          <div className="sd-jform-emotions">
            <span className="sd-jform-label">احساس همراه این لحظه:</span>
            <div className="sd-emotions-row">
              {EMOTIONS.slice(0, 6).map(em => (
                <button
                  key={em.id}
                  className={`sd-em-mini-chip ${newEmotion === em.id ? 'active' : ''}`}
                  onClick={() => setNewEmotion(em.id as EmotionId)}
                >
                  <span>{em.emoji}</span>
                  <span>{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="sd-act-textarea"
            rows={5}
            placeholder="با خودت کاملاً صادق باش. اینجا هیچ قضاوتی نیست…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
          />

          <div className="sd-jform-actions">
            <button className="sd-btn sd-btn-outline" onClick={() => setIsAddingNew(false)}>
              انصراف
            </button>
            <button
              className="sd-btn sd-btn-gold"
              disabled={!newText.trim()}
              onClick={handleSubmitNew}
            >
              <Check size={16} /> ثبت در دفتر درون (+۱۵ XP)
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="sd-journal-toolbar">
        <div className="sd-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="جست‌وجو در نوشته‌ها و پرسش‌ها…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="sd-select"
          value={selectedEmotionFilter}
          onChange={e => setSelectedEmotionFilter(e.target.value)}
        >
          <option value="all">همه احساسات</option>
          {EMOTIONS.map(em => (
            <option key={em.id} value={em.id}>{em.emoji} {em.label}</option>
          ))}
        </select>
      </div>

      {/* Entries List */}
      <div className="sd-journal-entries-grid">
        {filteredEntries.length === 0 ? (
          <div className="sd-journal-empty">
            <Feather size={36} />
            <p>هنوز یادداشتی در این بخش ثبت نشده است.</p>
            <button className="sd-btn sd-btn-gold" onClick={() => setIsAddingNew(true)}>
              نخستین یادداشت را بنویس
            </button>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const emotionObj = EMOTIONS.find(e => e.id === entry.emotion);
            const dateStr = new Date(`${entry.date}T12:00:00`).toLocaleDateString('fa-IR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <article key={entry.id} className="sd-journal-card">
                <div className="sd-jcard-head">
                  <span className="sd-jcard-date">
                    <Calendar size={13} /> {dateStr}
                  </span>
                  {emotionObj && (
                    <span className="sd-jcard-emotion">
                      {emotionObj.emoji} {emotionObj.label}
                    </span>
                  )}
                </div>

                {entry.prompt && (
                  <p className="sd-jcard-prompt">
                    <Feather size={14} /> {entry.prompt}
                  </p>
                )}

                <p className="sd-jcard-text">{entry.text}</p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
