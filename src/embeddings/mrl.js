// Matryoshka Representation Learning (MRL) adapter (simple hierarchical downsampling)
// This creates nested, smaller-dimension embeddings derived from a full-dimension vector.
// The adapter takes a base embedding function that returns a full-dimension vector (default 768)
// and returns a function that can produce embeddings at requested dims like 128,256,...

export function createMRL(baseEmbeddingFn, defaultTargetDim = 768) {
  if (!baseEmbeddingFn) throw new Error('baseEmbeddingFn required');

  // Reduce a full-length vector to targetDim by averaging contiguous blocks.
  function reduceByBlocks(fullVec, targetDim) {
    const F = fullVec.length;
    if (targetDim >= F) return fullVec;

    // Safety for invalid targets
    if (targetDim <= 0) return fullVec;

    const out = new Array(targetDim).fill(0);
    const blockSize = F / targetDim; // float

    for (let i = 0; i < targetDim; i++) {
      const start = Math.floor(i * blockSize);
      const end = Math.floor((i + 1) * blockSize);
      let sum = 0;
      let count = 0;

      // Ensure we don't go out of bounds
      const safeEnd = Math.min(F, end);
      const safeStart = Math.min(F - 1, start);

      for (let j = safeStart; j < safeEnd; j++) {
        sum += fullVec[j] || 0;
        count++;
      }

      // If block is empty (e.g. upsampling or very small blocks), take nearest
      if (count === 0) {
        out[i] = fullVec[safeStart] || 0;
      } else {
        out[i] = sum / count;
      }
    }

    // normalize output
    const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
    return out.map(v => v / norm);
  }

  // Returned embedding function: (text, dim) => Promise<number[]>
  return async function mrlEmbedding(text, dim = defaultTargetDim) {
    // Always get full model embedding first
    const baseVec = await baseEmbeddingFn(text);

    if (!Array.isArray(baseVec)) throw new Error('baseEmbeddingFn must return numeric array');

    // Normalize base vector if we are returning it directly
    if (dim >= baseVec.length) {
      const norm = Math.sqrt(baseVec.reduce((s, v) => s + v * v, 0)) || 1;
      return baseVec.map(v => v / norm);
    }

    return reduceByBlocks(baseVec, dim);
  };
}

export default createMRL;
