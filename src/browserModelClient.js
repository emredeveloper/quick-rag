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
    }
  };
}

export default createBrowserModelClient;


