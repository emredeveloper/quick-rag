import {
  QueryExpander,
  QueryDecomposer,
  MultiQueryGenerator
} from 'quick-rag';

const expander = new QueryExpander();
const decomposer = new QueryDecomposer();
const multi = new MultiQueryGenerator();

const q = 'compare vector search and bm25 for api docs';

console.log('expanded:', expander.expand(q));
console.log('decomposed:', decomposer.decompose(q));
console.log('multi-query:', multi.generateVariations(q));
