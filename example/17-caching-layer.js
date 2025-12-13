/**
 * Quick RAG v2.3.0 - Caching Layer Example
 * 
 * Bu örnek, tekrarlanan embedding ve sorgu işlemlerini hızlandırmak
 * için cache katmanının nasıl kullanılacağını gösterir.
 * 
 * Modeller:
 * - Ollama: ministral-3:3b (chat)
 * - Embedding: embeddinggemma (embedding)
 */

import { 
    OllamaRAGClient,
    createOllamaRAGEmbedding,
    InMemoryVectorStore,
    Retriever,
    CacheManager,
    EmbeddingCache
} from '../src/index.js';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m'
};

async function main() {
    console.log(`${colors.magenta}🚀 Quick RAG v2.3.0 - Caching Layer Örneği${colors.reset}\n`);

    // Ollama client oluştur
    const client = new OllamaRAGClient();

    // Embedding fonksiyonu oluştur (client gerekli)
    const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

    // ========== Yöntem 1: CacheManager Kullanımı (Önerilen) ==========
    console.log(`${colors.blue}📦 Yöntem 1: CacheManager Kullanımı${colors.reset}\n`);

    const cache = new CacheManager({
        embeddings: { maxSize: 5000, ttl: 60 * 60 * 1000 }, // 1 saat TTL
        queries: { maxSize: 500, ttl: 30 * 60 * 1000 }       // 30 dakika TTL
    });

    // Embedding fonksiyonunu cache ile sar
    const cachedEmbed = cache.wrapEmbedding(embed);

    // Cache'li embedding ile vector store oluştur
    const store = new InMemoryVectorStore(cachedEmbed);

    // Dökümanları ekle
    const documents = [
        { id: 'doc1', text: 'RAG, Retrieval Augmented Generation anlamına gelir ve bilgi getirme ile metin üretimini birleştirir.', meta: { topic: 'rag' } },
        { id: 'doc2', text: 'Vektör veritabanları, benzerlik araması için embedding vektörlerini saklar.', meta: { topic: 'vectors' } },
        { id: 'doc3', text: 'LLM\'ler (Büyük Dil Modelleri) insan benzeri metin yanıtları üretebilir.', meta: { topic: 'llm' } },
        { id: 'doc4', text: 'Embedding\'ler, metnin sayısal vektör temsilleridir ve anlamsal benzerlik hesaplamasında kullanılır.', meta: { topic: 'embeddings' } },
        { id: 'doc5', text: 'JavaScript, web tarayıcılarında çalışan dinamik bir programlama dilidir.', meta: { topic: 'javascript' } }
    ];

    console.log('Dökümanlar ekleniyor...');
    await store.addDocuments(documents);
    console.log(`  ✅ ${documents.length} döküman eklendi\n`);

    // Retriever oluştur
    const retriever = new Retriever(store);

    // İlk sorgu (cache miss)
    console.log(`${colors.cyan}İlk sorgu (cache miss):${colors.reset}`);
    let start = Date.now();
    const results1 = await retriever.getRelevant('RAG nedir?', 2);
    console.log(`  ⏱️  Süre: ${Date.now() - start}ms`);
    console.log(`  📄 Sonuçlar:`);
    results1.forEach(r => console.log(`     - ${r.text.substring(0, 60)}...`));

    // Aynı sorgu tekrar (cache hit)
    console.log(`\n${colors.cyan}Aynı sorgu tekrar (cache hit):${colors.reset}`);
    start = Date.now();
    const results2 = await retriever.getRelevant('RAG nedir?', 2);
    console.log(`  ⏱️  Süre: ${Date.now() - start}ms (çok daha hızlı!)`);

    // Cache istatistiklerini göster
    console.log(`\n${colors.yellow}📊 Cache İstatistikleri:${colors.reset}`);
    const stats = cache.getStats();
    console.log(`  Embedding Cache Boyutu: ${stats.embeddings.size}`);
    console.log(`  Embedding Cache Hit: ${stats.embeddings.cacheHits}`);
    console.log(`  Embedding Cache Miss: ${stats.embeddings.cacheMisses}`);
    const hitRate = stats.embeddings.cacheHits + stats.embeddings.cacheMisses > 0
        ? (stats.embeddings.cacheHits / (stats.embeddings.cacheHits + stats.embeddings.cacheMisses) * 100).toFixed(1)
        : 0;
    console.log(`  Hit Rate: ${hitRate}%`);

    // ========== Yöntem 2: EmbeddingCache Doğrudan Kullanımı ==========
    console.log(`\n\n${colors.blue}📦 Yöntem 2: EmbeddingCache Doğrudan Kullanımı${colors.reset}\n`);

    const embeddingCache = new EmbeddingCache({
        maxSize: 1000,
        normalizeText: true  // Metin normalizasyonu ile daha iyi cache hit
    });

    // Embedding fonksiyonunu sar
    const directCachedEmbed = embeddingCache.wrap(embed);

    // Benzer metinlerle test et
    console.log('Benzer metinlerle test ediliyor...');
    
    const texts = [
        'Merhaba dünya',
        'merhaba dünya',      // Küçük harf - normalizasyon sonrası aynı
        'MERHABA DÜNYA',      // Büyük harf - normalizasyon sonrası aynı
        'Merhaba  dünya',     // Fazla boşluk - normalizasyon sonrası aynı
    ];

    for (const text of texts) {
        console.log(`  Embedding: "${text}"`);
        await directCachedEmbed(text);
    }

    const embStats = embeddingCache.getStats();
    console.log(`\n${colors.yellow}📊 EmbeddingCache İstatistikleri:${colors.reset}`);
    console.log(`  Cache boyutu: ${embStats.size}`);
    console.log(`  Cache hits: ${embStats.cacheHits}`);
    console.log(`  Cache misses: ${embStats.cacheMisses}`);

    // ========== RAG ile Cache Kullanımı ==========
    console.log(`\n\n${colors.blue}🤖 RAG ile Cache Kullanımı${colors.reset}\n`);
    
    // Sorguyu çalıştır
    const query = 'Embedding nedir ve ne işe yarar?';
    console.log(`Soru: ${query}\n`);
    
    const relevantDocs = await retriever.getRelevant(query, 2);
    const context = relevantDocs.map(d => d.text).join('\n\n');
    
    const response = await client.chat({
        model: 'ministral-3:3b',
        messages: [
            { role: 'system', content: 'Sen yardımcı bir asistansın. Verilen bilgilere dayanarak Türkçe cevap ver.' },
            { role: 'user', content: `Bilgi:\n${context}\n\nSoru: ${query}` }
        ],
        stream: false
    });

    console.log(`${colors.green}Cevap:${colors.reset}`);
    console.log(response.message?.content || response);

    // Final cache durumu
    console.log(`\n${colors.yellow}📊 Final Cache Durumu:${colors.reset}`);
    const finalStats = cache.getStats();
    console.log(`  Toplam embedding cache boyutu: ${finalStats.embeddings.size}`);
    console.log(`  Toplam cache hits: ${finalStats.embeddings.cacheHits}`);

    console.log(`\n${colors.green}✅ Caching örneği tamamlandı!${colors.reset}\n`);
}

main().catch(console.error);
