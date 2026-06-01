// Spaced-repetition scheduling, computed entirely from user_attempts — no
// extra tables. Leitner-style: a question's interval grows with each
// consecutive "got it", and resets the moment it's missed. A question is
// "due" once now ≥ lastAttempt + interval, and "mastered" (dropped from the
// queue) after enough consecutive corrects.
import { supabase } from './supabase.js';

const DAY = 864e5;
// Days to wait based on how many times in a row it's been correct.
const INTERVALS = [0, 1, 3, 7, 14];   // 0 corrects → due now; 4+ → mastered
const MASTERED_AFTER = INTERVALS.length;   // 5 consecutive corrects = mastered

// Trailing consecutive corrects, counting back from the most recent attempt.
function trailingCorrect(sorted) {
  let n = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].is_correct) n += 1; else break;
  }
  return n;
}

// Returns { due: [...], counts: { due, learning, mastered } }.
// Each due item carries the question + why it's due, ordered most-overdue first.
export async function getReviewQueue(userId) {
  const { data: rows, error } = await supabase
    .from('user_attempts')
    .select('question_id, is_correct, attempted_at, questions(id, label, marks, slot_id, paper_id, question_slots(topic), papers(year, session, paper_number))')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: true });
  if (error) throw error;
  return computeQueue(rows || []);
}

// Pure: turn time-ordered attempt rows (with an embedded `questions`) into the
// review queue. Shared so the dashboard can reuse rows it already fetched.
export function computeQueue(rows) {
  const byQ = new Map();
  for (const a of rows || []) {
    if (!a.questions) continue;            // question deleted — skip
    const list = byQ.get(a.question_id) || [];
    list.push(a);
    byQ.set(a.question_id, list);
  }

  const now = Date.now();
  const due = [];
  let learning = 0, mastered = 0;

  for (const [, list] of byQ) {
    const sorted = list;                   // already time-ordered by the query
    const streak = trailingCorrect(sorted);
    if (streak >= MASTERED_AFTER) { mastered += 1; continue; }
    learning += 1;
    const last = sorted[sorted.length - 1];
    const lastAt = new Date(last.attempted_at).getTime();
    const dueAt = lastAt + INTERVALS[streak] * DAY;
    if (now >= dueAt) {
      const q = last.questions;
      due.push({
        questionId: q.id,
        label: q.label,
        marks: q.marks,
        topic: q.question_slots?.topic || 'Other',
        paper: q.papers ? `${q.papers.session || ''} ${q.papers.year || ''} · P${q.papers.paper_number ?? ''}`.trim() : '',
        lastCorrect: last.is_correct,
        lastAt,
        overdueDays: Math.floor((now - dueAt) / DAY),
        streak,
      });
    }
  }

  due.sort((a, b) => (b.overdueDays - a.overdueDays) || (a.lastAt - b.lastAt));
  return { due, counts: { due: due.length, learning, mastered } };
}
