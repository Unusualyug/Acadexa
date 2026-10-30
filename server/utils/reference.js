import Counter from '../models/Counter.js';

export async function nextReference(prefix) {
  const key = `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
  return `${key}-${String(doc.seq).padStart(4, '0')}`;
}
