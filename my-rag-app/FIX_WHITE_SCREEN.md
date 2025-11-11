# White Screen Issue - Solution

## Problem
`quick-rag@2.0.1` browser build was not exporting `chunkDocuments`, causing an import error and displaying a white screen.

## Solution: npm link for Local Development

### Step 1: Create link in main project
```bash
# In main project folder (javascript-ai)
cd C:\Users\emreq\Desktop\javascript-ai
npm link
```

### Step 2: Use link in my-rag-app
```bash
# In my-rag-app folder
cd C:\Users\emreq\Desktop\javascript-ai\my-rag-app
npm link quick-rag
```

### Step 3: Run
```bash
npm run dev
```

## Alternative: Update from npm (after 2.0.2 is published)

```bash
cd my-rag-app
npm install quick-rag@^2.0.2
```

## Verification
```bash
npm list quick-rag
# Should see quick-rag@2.0.2
```

## Note
I've updated the version to `^2.0.2` in `package.json`. You can use `npm link` for local development.
