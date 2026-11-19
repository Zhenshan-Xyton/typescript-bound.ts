// B2 STRESS FIXTURE (typescript): BOUND
// EFFECT: boundedness:UNBOUNDED -> boundedness:BOUNDED
// OBSERVABLE AT: R1 (syntax only -- no execution, no compilation, no dataflow required to see it)
// GROUNDED IN: CodeQL bundles TypeScript under the `javascript` extractor, so the one path
//   below is under codeql_census/repo/javascript/ql/lib/.
//   semmle/javascript/DefensiveProgramming.qll defines a generic "guard before use" concept
//   (`DefensiveExpressionTest` and its subclasses, e.g. `UndefinedNullTest`/`TypeofTest`,
//   lines 11-387), but it is scoped specifically to null/undefined/typeof presence checks, not
//   numeric index-vs-length range checks -- so it is at most a loose structural analogue here,
//   not a direct model. A dedicated search of this checkout (`class .*Bound`, `IndexCheck`,
//   `BoundsCheck`) found no array/buffer/typed-array bounds-check concept class anywhere in
//   CodeQL's JS library -- it is grounded directly in ECMAScript/TypeScript `Array`,
//   `TypedArray`, `Buffer`, and `DataView` index-and-length stdlib semantics per the spec's
//   fallback rule.
// REALIZATIONS (noun x verb-spelling, each CLOSED + OPEN):
//   1. noun=Int32Array sample buffer, verb=index < samples.length
//   2. noun=Buffer, verb=offset + 4 <= buffer.length
//   3. noun=string, verb=index < text.length
//   4. noun=Array<T>, verb=Number.isInteger(idx) && idx < items.length
//   5. noun=DataView over ArrayBuffer, verb=offset + 4 <= view.byteLength
//   6. noun=paginated result slice, verb=Math.min(requestedLimit, MAX_PAGE_SIZE)
//   7. noun=ring buffer write slot, verb=writeIndex < ring.capacity

// --- realization 1: noun=Int32Array sample buffer, verb=index < samples.length -
// CLOSED
function readSampleSafe(samples: Int32Array, index: number): number {
  if (index < 0 || index >= samples.length) throw new RangeError('index out of bounds'); // bound check precedes...
  return samples[index]; // ...the indexed access
}

// OPEN
function readSampleUnsafe(samples: Int32Array, index: number): number {
  // no bound check anywhere before this -- index is trusted as-is.
  return samples[index];
}

// --- realization 2: noun=Buffer, verb=offset + 4 <= buffer.length --------------
// CLOSED
function readFrameLengthSafe(buffer: Buffer, offset: number): number {
  if (offset < 0 || offset + 4 > buffer.length) throw new RangeError('read past end of buffer'); // bound check precedes...
  return buffer.readUInt32LE(offset); // ...the indexed access
}

// OPEN
function readFrameLengthUnsafe(buffer: Buffer, offset: number): number {
  // no bound check anywhere before this.
  return buffer.readUInt32LE(offset);
}

// --- realization 3: noun=string, verb=index < text.length ----------------------
// CLOSED
function charAtSafe(text: string, index: number): string {
  if (index < 0 || index >= text.length) throw new RangeError('index out of bounds'); // bound check precedes...
  return text.charAt(index); // ...the indexed access
}

// OPEN
function charAtUnsafe(text: string, index: number): string {
  // no bound check anywhere before this.
  return text.charAt(index);
}

// --- realization 4: noun=Array<T>, verb=Number.isInteger(idx) && idx < items.length ---
// CLOSED
function getElementSafe<T>(items: readonly T[], idx: number): T {
  if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) {
    throw new RangeError('index out of bounds'); // bound check precedes the indexed access
  }
  return items[idx]; // the indexed access
}

// OPEN
function getElementUnsafe<T>(items: readonly T[], idx: number): T {
  // no bound check anywhere before this.
  return items[idx];
}

// --- realization 5: noun=DataView over ArrayBuffer, verb=offset + 4 <= view.byteLength ---
// CLOSED
function readTimestampSafe(view: DataView, offset: number): number {
  if (offset < 0 || offset + 4 > view.byteLength) throw new RangeError('read past end of view'); // bound check precedes...
  return view.getUint32(offset); // ...the indexed access
}

// OPEN
function readTimestampUnsafe(view: DataView, offset: number): number {
  // no bound check anywhere before this.
  return view.getUint32(offset);
}

// --- realization 6: noun=paginated result slice, verb=Math.min(requestedLimit, MAX_PAGE_SIZE) ---
const MAX_PAGE_SIZE = 100;

// CLOSED
function paginateSafe<T>(items: readonly T[], offset: number, requestedLimit: number): T[] {
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE); // bound check (clamp) precedes...
  return items.slice(offset, offset + limit); // ...the indexed access
}

// OPEN
function paginateUnsafe<T>(items: readonly T[], offset: number, requestedLimit: number): T[] {
  // no bound/clamp check anywhere before this -- requestedLimit is trusted as-is, allowing an
  // arbitrarily large slice size to be requested.
  return items.slice(offset, offset + requestedLimit);
}

// --- realization 7: noun=ring buffer write slot, verb=writeIndex < ring.capacity ---
interface RingBuffer<T> {
  capacity: number;
  slots: (T | undefined)[];
}

// CLOSED
function ringBufferWriteSafe<T>(ring: RingBuffer<T>, writeIndex: number, value: T): void {
  if (writeIndex < 0 || writeIndex >= ring.capacity) {
    throw new RangeError('write index out of bounds'); // bound check precedes...
  }
  ring.slots[writeIndex] = value; // ...the indexed access
}

// OPEN
function ringBufferWriteUnsafe<T>(ring: RingBuffer<T>, writeIndex: number, value: T): void {
  // no bound check anywhere before this.
  ring.slots[writeIndex] = value;
}

export {
  readSampleSafe,
  readSampleUnsafe,
  readFrameLengthSafe,
  readFrameLengthUnsafe,
  charAtSafe,
  charAtUnsafe,
  getElementSafe,
  getElementUnsafe,
  readTimestampSafe,
  readTimestampUnsafe,
  paginateSafe,
  paginateUnsafe,
  ringBufferWriteSafe,
  ringBufferWriteUnsafe,
};
