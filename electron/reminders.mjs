export const MINUTE = 60_000;
export const defaultState = (now = Date.now()) => ({
  pet: 'mochi', voiceEnabled: true, volume: 75, pausedUntil: 0,
  reminders: [
    { id: 'water', title: 'Drink some water', kind: 'water', minutes: 45, enabled: true, nextAt: now + 45 * MINUTE },
    { id: 'walk', title: 'Stretch your legs', kind: 'walk', minutes: 60, enabled: true, nextAt: now + 60 * MINUTE },
    { id: 'eyes', title: 'Rest your eyes', kind: 'eyes', minutes: 20, enabled: false, nextAt: now + 20 * MINUTE },
  ], tasks: [], history: [],
});
export function validateState(value) {
  if (!value || !['mochi','peach','cloud'].includes(value.pet) || typeof value.voiceEnabled !== 'boolean' || !Number.isFinite(value.volume) || value.volume < 0 || value.volume > 100 || !Number.isFinite(value.pausedUntil)) throw new Error('Invalid settings.');
  if (!Array.isArray(value.reminders) || value.reminders.length > 20 || !Array.isArray(value.tasks) || value.tasks.length > 100 || !Array.isArray(value.history) || value.history.length > 100) throw new Error('Too many items.');
  const ids = new Set();
  for (const r of [...value.reminders, ...value.tasks]) {
    if (typeof r.id !== 'string' || ids.has(r.id) || typeof r.title !== 'string' || !r.title.trim() || r.title.length > 120 || !Number.isFinite(r.nextAt) || r.nextAt < 0) throw new Error('Invalid reminder.');
    ids.add(r.id);
  }
  for (const r of value.reminders) if (!['water','walk','eyes'].includes(r.kind) || !Number.isInteger(r.minutes) || r.minutes < 1 || r.minutes > 1440 || typeof r.enabled !== 'boolean') throw new Error('Choose an interval between 1 and 1440 minutes.');
  for (const t of value.tasks) if (typeof t.done !== 'boolean') throw new Error('Invalid task.');
  for (const h of value.history) if (typeof h.id !== 'string' || typeof h.title !== 'string' || h.title.length > 160 || !Number.isFinite(h.at)) throw new Error('Invalid history.');
  return structuredClone(value);
}
export function tick(state, now = Date.now()) {
  const next = structuredClone(state), due = [];
  if (state.pausedUntil > now) return { state: next, due };
  for (const r of next.reminders) if (r.enabled && r.nextAt <= now) {
    due.push({ id: r.id, title: r.title, kind: r.kind });
    r.nextAt = now + r.minutes * MINUTE;
  }
  for (const t of next.tasks) if (!t.done && t.nextAt <= now) {
    due.push({ id: t.id, title: t.title, kind: 'work' });
    t.nextAt = now + 30 * MINUTE;
  }
  // Catch up once after sleep; never replay every missed interval.
  for (const r of due) next.history.unshift({ id: `${r.id}-${now}`, title: r.title, at: now });
  next.history = next.history.slice(0, 100);
  return { state: next, due };
}
export function messageFor(reminder) {
  const messages = {
    water: 'A little sip, a little reset. Time to drink some water!',
    walk: 'You have been doing great. Let’s stand up and take a little walk!',
    eyes: 'Time for a tiny screen break. Look away and let your eyes rest.',
  };
  return messages[reminder.kind] || `A gentle nudge: ${reminder.title}. One little step at a time!`;
}
