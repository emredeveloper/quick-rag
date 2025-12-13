/**
 * Quick RAG v2.3.0 - Conversation Manager Example
 * 
 * Bu örnek, konuşma geçmişini yönetme, context window limitleri
 * ve otomatik özetleme özelliklerini gösterir.
 * 
 * Modeller:
 * - Ollama: ministral-3:3b (chat)
 */

import {
    OllamaRAGClient,
    ConversationManager,
    ContextWindow,
    tokenCounters,
    getContextLimit,
    extractiveSummarize
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
    console.log(`${colors.magenta}🚀 Quick RAG v2.3.0 - Conversation Manager Örneği${colors.reset}\n`);

    // Ollama client oluştur
    const client = new OllamaRAGClient();

    // ========== Temel Konuşma Yönetimi ==========
    console.log(`${colors.blue}📝 Temel Konuşma Yönetimi${colors.reset}\n`);

    const conversation = new ConversationManager({
        maxTokens: 4096,
        reservedTokens: 512,  // Yanıt için ayır
        systemPrompt: 'Sen programlama konusunda uzman yardımcı bir AI asistanısın. Türkçe cevap ver.'
    });

    // Mesaj ekle
    conversation.addMessage('user', 'TypeScript nedir?');
    conversation.addMessage('assistant', 'TypeScript, JavaScript\'in tip güvenli bir üst kümesidir. Statik tip kontrolü ve nesne yönelimli programlama özellikleri ekler.');

    conversation.addMessage('user', 'Nasıl kurarım?');
    conversation.addMessage('assistant', 'npm install -g typescript komutu ile global olarak kurabilirsiniz. Sonra tsc komutu ile .ts dosyalarını derleyebilirsiniz.');

    conversation.addMessage('user', 'tsconfig.json ne işe yarar?');

    // LLM için context al
    const context = conversation.getContext();
    console.log('LLM için Context:');
    context.forEach(msg => {
        const preview = msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content;
        console.log(`  [${msg.role}]: ${preview}`);
    });

    // Token kullanımını kontrol et
    console.log(`\n${colors.yellow}Token Kullanımı:${colors.reset}`);
    console.log(`  Mesaj sayısı: ${conversation.messages.length}`);
    console.log(`  Toplam tahmini token: ${conversation.metadata.totalTokens}`);

    // ========== LLM ile Gerçek Konuşma ==========
    console.log(`\n\n${colors.blue}🤖 LLM ile Gerçek Konuşma${colors.reset}\n`);

    // Son mesaja cevap al
    const response = await client.chat({
        model: 'ministral-3:3b',
        messages: context,
        stream: false
    });

    const answer = response.message?.content || response;
    console.log(`${colors.green}AI Cevabı:${colors.reset}`);
    console.log(answer);

    // Cevabı konuşmaya ekle
    conversation.addMessage('assistant', answer);

    // ========== Context Window Yönetimi ==========
    console.log(`\n\n${colors.blue}📐 Context Window Yönetimi${colors.reset}\n`);

    // Farklı modeller için context limitleri
    console.log('Model Context Limitleri:');
    console.log(`  GPT-4: ${getContextLimit('gpt-4')} token`);
    console.log(`  Claude-3: ${getContextLimit('claude-3-opus')} token`);
    console.log(`  Llama3: ${getContextLimit('llama3')} token`);
    console.log(`  Mistral: ${getContextLimit('mistral')} token`);

    // Context window oluştur
    const contextWindow = new ContextWindow({
        maxTokens: 4096,
        reservedTokens: 1024,
        tokenCounter: tokenCounters.gptApprox
    });

    // Uzun metin testi
    const longText = 'Bu çok uzun bir metin olacak ve context window\'a sığmayabilir. '.repeat(50);
    console.log(`\nUzun metin (${longText.length} karakter):`);
    console.log(`  Sığıyor mu: ${contextWindow.fits(longText)}`);

    // Gerekirse kısalt
    const truncated = contextWindow.truncate(longText, 200);
    console.log(`  Kısaltılmış uzunluk: ${truncated.length} karakter`);

    // ========== Özetleme ==========
    console.log(`\n\n${colors.blue}📋 Konuşma Özetleme${colors.reset}\n`);

    // Uzun konuşma geçmişi simüle et
    const longHistory = `
    Kullanıcı: JavaScript nedir?
    Asistan: JavaScript, web tarayıcılarında çalışan dinamik bir programlama dilidir.
    
    Kullanıcı: React nedir?
    Asistan: React, Facebook tarafından geliştirilen bir JavaScript kütüphanesidir.
    
    Kullanıcı: Node.js nedir?
    Asistan: Node.js, JavaScript'i sunucu tarafında çalıştıran bir runtime ortamıdır.
    
    Kullanıcı: Express.js nedir?
    Asistan: Express.js, Node.js için minimal bir web framework'üdür.
    `.trim();

    console.log('Orijinal Konuşma Geçmişi:');
    console.log(longHistory.substring(0, 200) + '...');

    // Extractive özetleme (LLM gerektirmez)
    const summary = extractiveSummarize(longHistory, { maxSentences: 3 });
    console.log(`\n${colors.yellow}Özet (Extractive):${colors.reset}`);
    console.log(summary);

    // ========== Konuşma Fork ve Export ==========
    console.log(`\n\n${colors.blue}🔀 Konuşma Fork ve Export${colors.reset}\n`);

    // Konuşmayı fork et
    const forkedConversation = conversation.fork();
    forkedConversation.addMessage('user', 'Bu fork edilmiş konuşmada yeni bir soru');
    
    console.log(`Orijinal mesaj sayısı: ${conversation.messages.length}`);
    console.log(`Fork edilmiş mesaj sayısı: ${forkedConversation.messages.length}`);

    // JSON olarak export et
    const exported = conversation.toJSON();
    console.log(`\n${colors.yellow}Export edilen veri:${colors.reset}`);
    console.log(`  ID: ${exported.id}`);
    console.log(`  Mesaj sayısı: ${exported.messages.length}`);
    console.log(`  Oluşturulma: ${new Date(exported.metadata.createdAt).toLocaleString()}`);

    // ========== Devam Eden Konuşma ==========
    console.log(`\n\n${colors.blue}💬 Devam Eden Konuşma${colors.reset}\n`);

    // Yeni soru sor
    conversation.addMessage('user', 'React ile TypeScript nasıl kullanılır?');
    
    const newContext = conversation.getContext();
    const newResponse = await client.chat({
        model: 'ministral-3:3b',
        messages: newContext,
        stream: false
    });

    console.log('Soru: React ile TypeScript nasıl kullanılır?');
    console.log(`\n${colors.green}Cevap:${colors.reset}`);
    console.log(newResponse.message?.content || newResponse);

    console.log(`\n${colors.green}✅ Conversation Manager örneği tamamlandı!${colors.reset}\n`);
}

main().catch(console.error);
