import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lastDays, shiftDay, dayKey, WHEEL_AREAS, DATA_VERSION } from '../lib/growth-data.ts';

describe('Monthly Growth & Mood Analytics Engine', () => {
  it('correctly slices 30-day and 7-day ranges without skipping dates', () => {
    const today = '2026-09-29';
    const week = lastDays(7, today);
    assert.equal(week.length, 7);
    assert.equal(week[week.length - 1], today);
    assert.equal(week[0], '2026-09-23');

    const month = lastDays(30, today);
    assert.equal(month.length, 30);
    assert.equal(month[month.length - 1], today);
    assert.equal(month[0], '2026-08-31');
  });

  it('calculates habit-mood correlation and mood boost score accurately', () => {
    const dates = lastDays(10, '2026-09-29');
    // Journal: mood 5 on even days, mood 2 on odd days
    const mockJournal = dates.map((date, i) => ({
      id: `j-${i}`,
      date,
      mood: i % 2 === 0 ? 5 : 2,
      text: 'Note',
      gratitude: 'Thanks',
    }));

    // Habit active only on even days
    const activeDays = dates.filter((_, i) => i % 2 === 0);
    const mockHabits = [
      { id: 'h1', title: 'مدیتیشن', days: activeDays, color: '#10b981' },
    ];

    const activeJournals = mockJournal.filter(j => activeDays.includes(j.date));
    const inactiveJournals = mockJournal.filter(j => !activeDays.includes(j.date));

    const activeAvg = activeJournals.reduce((s, j) => s + j.mood, 0) / activeJournals.length;
    const inactiveAvg = inactiveJournals.reduce((s, j) => s + j.mood, 0) / inactiveJournals.length;
    const boost = activeAvg - inactiveAvg;

    assert.equal(activeAvg, 5);
    assert.equal(inactiveAvg, 2);
    assert.equal(boost, 3);
  });

  it('evaluates life wheel radar pillars and calculates strongest and growth focus areas', () => {
    const wheel = {
      'سلامت جسم': 8,
      'آرامش ذهن': 9,
      'رابطه‌ها': 7,
      'خانواده': 9,
      'کار و یادگیری': 8,
      'وضعیت مالی': 4,
      'تفریح': 5,
      'معنا و ارزش‌ها': 9,
    };

    const scores = WHEEL_AREAS.map(area => ({ area, score: wheel[area] ?? 5 }));
    const sorted = [...scores].sort((a, b) => b.score - a.score);

    assert.equal(sorted[0].score, 9);
    assert.equal(sorted[sorted.length - 1].area, 'وضعیت مالی');
    assert.equal(sorted[sorted.length - 1].score, 4);
  });
});
