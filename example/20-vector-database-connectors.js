/**
 * Quick RAG v2.3.0 - Vector Database Connectors Example
 * 
 * Bu örnek, farklı vektör veritabanları ile nasıl çalışılacağını gösterir.
 * 
 * Not: Bu örnek Chroma ve Qdrant'ın çalışmasını gerektirir.
 * Yoksa InMemoryVectorStore ile çalışır.
 */

import {
    OllamaRAGClient,
    createOllamaRAGEmbedding,
    InMemoryVectorStore,
    createVectorStore,
    AbstractVectorStore,
    Retriever
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
    console.log(`${colors.magenta}🚀 Quick RAG v2.3.0 - Vector Database Connectors Örneği${colors.reset}\n`);

    // Ollama client ve embedding fonksiyonu oluştur
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

    // Test dökümanları
    const documents = [
        { id: 'doc1', text: 'TypeScript, JavaScript\'in statik tipli bir üst kümesidir.', meta: { lang: 'tr', category: 'programming' } },
        { id: 'doc2', text: 'React, kullanıcı arayüzleri oluşturmak için kullanılan bir JavaScript kütüphanesidir.', meta: { lang: 'tr', category: 'frontend' } },
        { id: 'doc3', text: 'Node.js, JavaScript\'i sunucu tarafında çalıştırmayı sağlar.', meta: { lang: 'tr', category: 'backend' } },
        { id: 'doc4', text: 'MongoDB, doküman tabanlı bir NoSQL veritabanıdır.', meta: { lang: 'tr', category: 'database' } },
        { id: 'doc5', text: 'PostgreSQL, güçlü bir ilişkisel veritabanı yönetim sistemidir.', meta: { lang: 'tr', category: 'database' } }
    ];

    // ========== 1. InMemoryVectorStore (Varsayılan) ==========
    console.log(`${colors.blue}📦 1. InMemoryVectorStore (Varsayılan)${colors.reset}\n`);
    
    const memoryStore = new InMemoryVectorStore(embed);
    
    console.log('Dökümanlar ekleniyor...');
    await memoryStore.addDocuments(documents);
    console.log(`  ✅ ${documents.length} döküman eklendi`);
    
    // Arama yap
    const memResults = await memoryStore.similaritySearch('JavaScript nedir?', 2);
    console.log(`\nArama sonuçları:`);
    memResults.forEach((doc, i) => {
        console.log(`  ${i + 1}. [${doc.id}] ${doc.text.substring(0, 50)}... (skor: ${doc.score?.toFixed(3)})`);
    });

    // ========== 2. Factory ile Vector Store Oluşturma ==========
    console.log(`\n\n${colors.blue}📦 2. createVectorStore Factory Kullanımı${colors.reset}\n`);

    // InMemory store (her zaman çalışır) - createVectorStore async
    const factoryStore = await createVectorStore('memory', embed, { dimensions: 768 });
    await factoryStore.addDocuments(documents);
    
    console.log(`Factory ile oluşturulan store tipi: ${factoryStore.constructor.name}`);
    console.log(`Döküman sayısı: ${factoryStore.docs.size}`);

    // ========== 3. Metadata Filtreleme ==========
    console.log(`\n\n${colors.blue}🔍 3. Metadata Filtreleme${colors.reset}\n`);

    // Sadece 'database' kategorisinde ara
    console.log('Sadece "database" kategorisinde arama:');
    const dbResults = await memoryStore.similaritySearch('veritabanı', 5, {
        filter: (doc) => doc.meta?.category === 'database'
    });
    
    dbResults.forEach((doc, i) => {
        console.log(`  ${i + 1}. [${doc.meta?.category}] ${doc.text.substring(0, 50)}...`);
    });

    // Sadece 'programming' ve 'frontend' kategorilerinde ara
    console.log('\n"programming" veya "frontend" kategorisinde arama:');
    const devResults = await memoryStore.similaritySearch('JavaScript', 5, {
        filter: (doc) => ['programming', 'frontend'].includes(doc.meta?.category)
    });
    
    devResults.forEach((doc, i) => {
        console.log(`  ${i + 1}. [${doc.meta?.category}] ${doc.text.substring(0, 50)}...`);
    });

    // ========== 4. Chroma ve Qdrant Konfigürasyonu (Referans) ==========
    console.log(`\n\n${colors.blue}📚 4. Harici Vector DB Yapılandırma Referansı${colors.reset}\n`);

    console.log(`${colors.yellow}ChromaDB Yapılandırması:${colors.reset}`);
    console.log(`
  import { ChromaVectorStore } from 'quick-rag';
  
  const chromaStore = new ChromaVectorStore(embedFn, {
    collectionName: 'my-documents',
    host: 'localhost',
    port: 8000,
    // veya
    path: './chroma-data'  // Persistent storage
  });
  
  // Chroma'yı başlatmak için:
  // docker run -p 8000:8000 chromadb/chroma
`);

    console.log(`${colors.yellow}Qdrant Yapılandırması:${colors.reset}`);
    console.log(`
  import { QdrantVectorStore } from 'quick-rag';
  
  const qdrantStore = new QdrantVectorStore(embedFn, {
    collectionName: 'my-documents',
    url: 'http://localhost:6333',
    dimensions: 768,
    // API key (opsiyonel)
    apiKey: 'your-api-key'
  });
  
  // Qdrant'ı başlatmak için:
  // docker run -p 6333:6333 qdrant/qdrant
`);

    // ========== 5. Özel Vector Store Oluşturma ==========
    console.log(`\n${colors.blue}🔧 5. Özel Vector Store Oluşturma${colors.reset}\n`);

    console.log('AbstractVectorStore\'u extend ederek özel store oluşturabilirsiniz:\n');
    console.log(`
  class MyCustomStore extends AbstractVectorStore {
    async addDocument(doc) {
      // Özel ekleme mantığı
    }
    
    async addDocuments(docs) {
      for (const doc of docs) {
        await this.addDocument(doc);
      }
    }
    
    async similaritySearch(query, k, options) {
      // Özel arama mantığı
    }
    
    async deleteDocument(id) {
      // Silme mantığı
    }
  }
`);

    // ========== 6. Retriever ile Kullanım ==========
    console.log(`\n${colors.blue}🎯 6. Retriever ile Kullanım${colors.reset}\n`);

    const retriever = new Retriever(memoryStore);
    
    // Basit retrieval
    const query = 'Backend geliştirme için hangi teknolojiler kullanılır?';
    console.log(`Sorgu: "${query}"\n`);
    
    const relevantDocs = await retriever.getRelevant(query, 3);
    
    console.log('Retriever sonuçları:');
    relevantDocs.forEach((doc, i) => {
        console.log(`  ${i + 1}. ${doc.text}`);
        console.log(`     Kategori: ${doc.meta?.category}, Skor: ${doc.score?.toFixed(3)}`);
    });

    // ========== 7. Store İstatistikleri ==========
    console.log(`\n\n${colors.blue}📊 7. Store İstatistikleri${colors.reset}\n`);

    console.log(`InMemoryVectorStore:`);
    console.log(`  Döküman sayısı: ${memoryStore.docs.size}`);
    console.log(`  Embedding boyutu: ${memoryStore.embeddings[0]?.length || 'N/A'}`);

    // Döküman ID'lerini listele
    console.log(`\nKayıtlı döküman ID'leri:`);
    memoryStore.ids.forEach(id => console.log(`  - ${id}`));

    // ========== 8. CRUD İşlemleri ==========
    console.log(`\n\n${colors.blue}✏️ 8. CRUD İşlemleri${colors.reset}\n`);

    // Yeni döküman ekle
    const newDoc = { 
        id: 'doc6', 
        text: 'Redis, yüksek performanslı bir in-memory veri deposudur.', 
        meta: { lang: 'tr', category: 'database' } 
    };
    
    await memoryStore.addDocument(newDoc);
    console.log(`✅ Yeni döküman eklendi: ${newDoc.id}`);
    console.log(`  Toplam döküman: ${memoryStore.docs.size}`);

    // Döküman güncelle (sil ve tekrar ekle)
    const updatedDoc = { 
        id: 'doc6', 
        text: 'Redis, in-memory veri yapıları deposudur ve cache olarak kullanılır.', 
        meta: { lang: 'tr', category: 'database', updated: true } 
    };
    
    await memoryStore.deleteDocument('doc6');
    await memoryStore.addDocument(updatedDoc);
    console.log(`\n✅ Döküman güncellendi: ${updatedDoc.id}`);

    // Döküman sil
    await memoryStore.deleteDocument('doc6');
    console.log(`\n✅ Döküman silindi: doc6`);
    console.log(`  Kalan döküman: ${memoryStore.docs.size}`);

    console.log(`\n${colors.green}✅ Vector Database Connectors örneği tamamlandı!${colors.reset}\n`);
}

main().catch(console.error);
