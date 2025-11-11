# Beyaz Ekran Sorunu - Çözüm

## Sorun
`quick-rag@2.0.1` browser build'inde `chunkDocuments` export edilmiyordu, bu yüzden import hatası oluşuyor ve beyaz ekran gösteriyordu.

## Çözüm: Local Development için npm link

### Adım 1: Ana projede link oluştur
```bash
# Ana proje klasöründe (javascript-ai)
cd C:\Users\emreq\Desktop\javascript-ai
npm link
```

### Adım 2: my-rag-app'te link kullan
```bash
# my-rag-app klasöründe
cd C:\Users\emreq\Desktop\javascript-ai\my-rag-app
npm link quick-rag
```

### Adım 3: Çalıştır
```bash
npm run dev
```

## Alternatif: npm'den Güncelleme (2.0.2 publish edildikten sonra)

```bash
cd my-rag-app
npm install quick-rag@^2.0.2
```

## Kontrol
```bash
npm list quick-rag
# quick-rag@2.0.2 görmeli
```

## Not
`package.json`'da versiyonu `^2.0.2` olarak güncelledim. `npm link` kullanırsanız local geliştirme yapabilirsiniz.
