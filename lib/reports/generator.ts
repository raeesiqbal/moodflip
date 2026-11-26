import { generate7DayReportPDF, type ReportDayGroup, type SevenDayReportData } from '@/lib/generatePDF';

type Entry = {
  id: string; mood: string; feeling: string; target_mood: string;
  action_title: string; action_desc: string; saved_at: string; created_at: string;
};

export type ReportData = {
  schemaVersion: 1;
  qualifyingDates: string[];
  entries: Entry[];
};

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseReportData(value: unknown): ReportData {
  if (!value || typeof value !== 'object') throw new Error('Report snapshot is missing');
  const data = value as Record<string, unknown>;
  if (data.schemaVersion !== 1 || !Array.isArray(data.qualifyingDates) || !Array.isArray(data.entries)) {
    throw new Error('Report snapshot format is invalid');
  }
  const dates = data.qualifyingDates;
  const entries = data.entries as Entry[];
  if (dates.length !== 7 || new Set(dates).size !== 7 || dates.some((date) => !isText(date) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) || entries.length < 7 || entries.length > 21) {
    throw new Error('Report snapshot qualification is invalid');
  }
  const actions = new Set<string>();
  for (const entry of entries) {
    if (!entry || !isText(entry.id) || !isText(entry.mood) || !isText(entry.feeling)
      || !isText(entry.target_mood) || !isText(entry.action_desc) || !isText(entry.saved_at)
      || !isText(entry.created_at) || !dates.includes(entry.saved_at) || Number.isNaN(Date.parse(entry.created_at))) {
      throw new Error('Report snapshot contains incomplete Mood Lifts');
    }
    const action = entry.action_desc.trim().toLocaleLowerCase();
    if (actions.has(action)) throw new Error('Report snapshot contains repeated historical actions');
    actions.add(action);
  }
  if (dates.some((date) => !entries.some((entry) => entry.saved_at === date))) {
    throw new Error('Report snapshot has an empty qualifying date');
  }
  return { schemaVersion: 1, qualifyingDates: dates as string[], entries };
}

export function generateReportPDF(data: ReportData, customerName?: string | null): Uint8Array {
  const snapshot = parseReportData(data);
  const moodCounts = new Map<string, number>();
  for (const entry of snapshot.entries) moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
  const mostFrequent = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const days: ReportDayGroup[] = snapshot.qualifyingDates.map((date, index) => ({
    date,
    dayNumber: index + 1,
    moodLifts: snapshot.entries.filter((entry) => entry.saved_at === date).map((entry) => ({
      id: entry.id,
      moodFamily: entry.mood,
      feeling: entry.feeling,
      specificFeeling: entry.feeling,
      positiveMood: entry.target_mood,
      actionText: [entry.action_title, entry.action_desc].filter(Boolean).join(': '),
      savedAt: `${new Date(entry.created_at).toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    })),
  }));
  const report: SevenDayReportData = {
    fullName: customerName?.trim() || 'Your saved Mood Lifts',
    startDate: snapshot.qualifyingDates[0],
    endDate: snapshot.qualifyingDates[6],
    savedDayCount: 7,
    moodLiftCount: snapshot.entries.length,
    days,
    patternSummary: `Across these seven saved days, you recorded ${snapshot.entries.length} Mood Lifts. ${mostFrequent[0]} appeared ${mostFrequent[1]} ${mostFrequent[1] === 1 ? 'time' : 'times'}. This is a summary of your saved entries, not a medical assessment.`,
  };
  const doc = generate7DayReportPDF(report);
  doc.setCreationDate(new Date(snapshot.entries[0].created_at));
  doc.setFileId(snapshot.entries[0].id.replace(/-/g, '').slice(0, 32));
  return new Uint8Array(doc.output('arraybuffer'));
}
