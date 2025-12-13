/**
 * Quick RAG v2.3.0 - RAG Evaluation Example
 * 
 * Bu örnek, RAG sistemi performansını standart Information Retrieval
 * metrikleri kullanarak nasıl değerlendireceğinizi gösterir.
 * 
 * Modeller:
 * - Embedding: embeddinggemma
 */

import {
    OllamaRAGClient,
    createOllamaRAGEmbedding,
    InMemoryVectorStore,
    Retriever,
    RAGEvaluator,
    // Bireysel metrikler
    precisionAtK,
    recallAtK,
    f1AtK,
    meanReciprocalRank,
    ndcgAtK,
    calculateAllMetrics
} from '../src/index.js';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m'
};

async function main() {
    console.log(`${colors.magenta}🚀 Quick RAG v2.3.0 - RAG Evaluation Örneği${colors.reset}\n`);

    // ========== Kurulum ==========
    console.log(`${colors.blue}⚙️ Sistem Kurulumu${colors.reset}\n`);

    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

    // Örnek bilgi tabanı
    const documents = [
        { id: 'doc1', text: 'Python yüksek seviyeli, okunabilir bir programlama dilidir.', meta: { topic: 'python' } },
        { id: 'doc2', text: 'JavaScript web tarayıcılarında çalışan dinamik bir dildir.', meta: { topic: 'javascript' } },
        { id: 'doc3', text: 'TypeScript, JavaScript\'e statik tip ekler.', meta: { topic: 'typescript' } },
        { id: 'doc4', text: 'Makine öğrenmesi, yapay zekanın bir alt dalıdır.', meta: { topic: 'ml' } },
        { id: 'doc5', text: 'Derin öğrenme, çok katmanlı sinir ağları kullanır.', meta: { topic: 'dl' } },
        { id: 'doc6', text: 'RAG, bilgi getirme ile metin üretimini birleştirir.', meta: { topic: 'rag' } },
        { id: 'doc7', text: 'Vektör veritabanları embedding\'leri benzerlik araması için saklar.', meta: { topic: 'vectors' } },
        { id: 'doc8', text: 'Doğal dil işleme, bilgisayarların metni anlamasını sağlar.', meta: { topic: 'nlp' } },
        { id: 'doc9', text: 'React, kullanıcı arayüzleri için bir JavaScript kütüphanesidir.', meta: { topic: 'react' } },
        { id: 'doc10', text: 'Node.js, JavaScript\'i sunucu tarafında çalıştırır.', meta: { topic: 'nodejs' } }
    ];

    // Vector store ve retriever oluştur
    const store = new InMemoryVectorStore(embed);
    console.log('Dökümanlar ekleniyor...');
    await store.addDocuments(documents);
    console.log(`  ✅ ${documents.length} döküman eklendi\n`);

    const retriever = new Retriever(store);

    // ========== Test Sorguları ve Ground Truth ==========
    console.log(`${colors.blue}📋 Test Sorguları ve Ground Truth${colors.reset}\n`);

    const testQueries = [
        {
            query: 'Python programlama dili nedir?',
            relevantDocs: ['doc1']
        },
        {
            query: 'Web geliştirme dilleri hakkında bilgi ver',
            relevantDocs: ['doc2', 'doc3', 'doc9']
        },
        {
            query: 'Yapay zeka ve makine öğrenmesi nedir?',
            relevantDocs: ['doc4', 'doc5']
        },
        {
            query: 'RAG sistemi nasıl çalışır?',
            relevantDocs: ['doc6', 'doc7']
        },
        {
            query: 'Doğal dil işleme ne işe yarar?',
            relevantDocs: ['doc8']
        }
    ];

    console.log(`Test sorgu sayısı: ${testQueries.length}`);
    testQueries.forEach((q, i) => {
        console.log(`  ${i + 1}. "${q.query}"`);
        console.log(`     Beklenen: [${q.relevantDocs.join(', ')}]`);
    });

    // ========== Bireysel Metrik Hesaplama ==========
    console.log(`\n\n${colors.blue}📊 Bireysel Metrik Örneği${colors.reset}\n`);

    // Simüle edilmiş retrieval sonucu
    const retrieved = ['doc1', 'doc4', 'doc2', 'doc5', 'doc3'];
    const relevant = ['doc1', 'doc2', 'doc3'];

    console.log(`Retrieved: [${retrieved.join(', ')}]`);
    console.log(`Relevant:  [${relevant.join(', ')}]`);
    console.log();

    // Her metriği hesapla ve açıkla
    const p3 = precisionAtK(retrieved, relevant, 3);
    console.log(`${colors.cyan}Precision@3:${colors.reset} ${p3.toFixed(3)}`);
    console.log(`  → İlk 3 sonuçtan kaçı doğru? (${retrieved.slice(0, 3).filter(id => relevant.includes(id)).length}/3)`);

    const r3 = recallAtK(retrieved, relevant, 3);
    console.log(`\n${colors.cyan}Recall@3:${colors.reset} ${r3.toFixed(3)}`);
    console.log(`  → Tüm doğru dökümanların kaçı ilk 3'te? (${retrieved.slice(0, 3).filter(id => relevant.includes(id)).length}/${relevant.length})`);

    const f1 = f1AtK(retrieved, relevant, 3);
    console.log(`\n${colors.cyan}F1@3:${colors.reset} ${f1.toFixed(3)}`);
    console.log(`  → Precision ve Recall'un harmonik ortalaması`);

    const mrr = meanReciprocalRank(retrieved, relevant);
    console.log(`\n${colors.cyan}MRR (Mean Reciprocal Rank):${colors.reset} ${mrr.toFixed(3)}`);
    const firstRelevantIdx = retrieved.findIndex(id => relevant.includes(id));
    console.log(`  → İlk doğru sonucun sırası: ${firstRelevantIdx + 1} (1/${firstRelevantIdx + 1} = ${mrr.toFixed(3)})`);

    const ndcg = ndcgAtK(retrieved, relevant, 5);
    console.log(`\n${colors.cyan}NDCG@5:${colors.reset} ${ndcg.toFixed(3)}`);
    console.log(`  → Sıralama kalitesi (1.0 = mükemmel sıralama)`);

    // ========== Tüm Metrikler ==========
    console.log(`\n\n${colors.blue}📈 Tüm Metrikler (K=1,3,5)${colors.reset}\n`);

    const allMetrics = calculateAllMetrics(retrieved, relevant, { kValues: [1, 3, 5] });
    
    console.log('┌─────────────┬─────────┬─────────┬─────────┐');
    console.log('│ Metrik      │  K=1    │  K=3    │  K=5    │');
    console.log('├─────────────┼─────────┼─────────┼─────────┤');
    console.log(`│ Precision   │ ${(allMetrics.precision?.[1] || 0).toFixed(3)}   │ ${(allMetrics.precision?.[3] || 0).toFixed(3)}   │ ${(allMetrics.precision?.[5] || 0).toFixed(3)}   │`);
    console.log(`│ Recall      │ ${(allMetrics.recall?.[1] || 0).toFixed(3)}   │ ${(allMetrics.recall?.[3] || 0).toFixed(3)}   │ ${(allMetrics.recall?.[5] || 0).toFixed(3)}   │`);
    console.log(`│ F1          │ ${(allMetrics.f1?.[1] || 0).toFixed(3)}   │ ${(allMetrics.f1?.[3] || 0).toFixed(3)}   │ ${(allMetrics.f1?.[5] || 0).toFixed(3)}   │`);
    console.log('└─────────────┴─────────┴─────────┴─────────┘');

    // ========== Gerçek Retrieval Değerlendirmesi ==========
    console.log(`\n\n${colors.blue}🔍 Gerçek Retrieval Değerlendirmesi${colors.reset}\n`);

    const results = [];

    for (const testQuery of testQueries) {
        // Retrieval yap
        const docs = await retriever.getRelevant(testQuery.query, 5);
        const retrievedIds = docs.map(d => d.id);

        // Metrikleri hesapla
        const metrics = calculateAllMetrics(retrievedIds, testQuery.relevantDocs, { kValues: [3, 5] });

        results.push({
            query: testQuery.query,
            expected: testQuery.relevantDocs,
            retrieved: retrievedIds,
            precision3: metrics.precision?.[3] || 0,
            recall3: metrics.recall?.[3] || 0,
            mrr: metrics.mrr || 0
        });

        console.log(`${colors.cyan}Sorgu:${colors.reset} "${testQuery.query}"`);
        console.log(`  Retrieved: [${retrievedIds.slice(0, 3).join(', ')}...]`);
        console.log(`  P@3: ${(metrics.precision?.[3] || 0).toFixed(3)}, R@3: ${(metrics.recall?.[3] || 0).toFixed(3)}, MRR: ${(metrics.mrr || 0).toFixed(3)}`);
        console.log();
    }

    // ========== Özet Rapor ==========
    console.log(`\n${colors.blue}📊 Değerlendirme Özeti${colors.reset}\n`);

    const avgPrecision = results.reduce((sum, r) => sum + r.precision3, 0) / results.length;
    const avgRecall = results.reduce((sum, r) => sum + r.recall3, 0) / results.length;
    const avgMRR = results.reduce((sum, r) => sum + r.mrr, 0) / results.length;

    console.log('┌────────────────────────┬─────────┐');
    console.log('│ Metrik                 │ Değer   │');
    console.log('├────────────────────────┼─────────┤');
    console.log(`│ Ortalama Precision@3   │ ${avgPrecision.toFixed(3)}   │`);
    console.log(`│ Ortalama Recall@3      │ ${avgRecall.toFixed(3)}   │`);
    console.log(`│ Ortalama MRR           │ ${avgMRR.toFixed(3)}   │`);
    console.log(`│ Test sorgu sayısı      │ ${results.length}       │`);
    console.log('└────────────────────────┴─────────┘');

    // Performans değerlendirmesi
    console.log(`\n${colors.yellow}📋 Değerlendirme:${colors.reset}`);
    if (avgMRR > 0.8) {
        console.log(`  ${colors.green}✅ Mükemmel! İlk sonuçlar genellikle doğru.${colors.reset}`);
    } else if (avgMRR > 0.5) {
        console.log(`  ${colors.yellow}⚠️ İyi. Ancak iyileştirme alanı var.${colors.reset}`);
    } else {
        console.log(`  ${colors.red}❌ Zayıf. Embedding modeli veya dökümanları gözden geçirin.${colors.reset}`);
    }

    if (avgPrecision > 0.7) {
        console.log(`  ${colors.green}✅ Precision yüksek - az yanlış pozitif.${colors.reset}`);
    }

    if (avgRecall > 0.7) {
        console.log(`  ${colors.green}✅ Recall yüksek - çoğu ilgili döküman bulunuyor.${colors.reset}`);
    }

    console.log(`\n${colors.green}✅ RAG Evaluation örneği tamamlandı!${colors.reset}\n`);
}

main().catch(console.error);
