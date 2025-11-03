// Simple browser client that proxies model calls to a server endpoint
// Default endpoint: /api/rag-generate (POST { model, prompt })
export function createBrowserModelClient({ endpoint = '/api/rag-generate', headers } = {}) {
  return {
    async generate(model, prompt) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({ model, prompt })
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      return data.response;
    },
    async *generateStream(model, prompt, { signal } = {}) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({ model, prompt, stream: true }),
        signal
      });
      if (!res.ok || !res.body) throw new Error(`Stream request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.response) yield obj.response;
          } catch {
            // Fallback: yield raw line
            yield line;
          }
        }
      }
      if (buffer.trim()) yield buffer.trim();
    }
  };
}

export default createBrowserModelClient;


