# 📦 NPM Publishing Guide for v0.6.0

## ✅ Pre-Publish Checklist

- [x] All tests passing (`npm test`)
- [x] Version updated to 0.6.0 in `package.json`
- [x] CHANGELOG.md created and updated
- [x] README.md updated with new features
- [x] All examples working with Ollama
- [x] No circular dependencies
- [x] Git repository clean

## 🚀 Publishing Commands

### 1. Verify Package Contents
```bash
npm pack --dry-run
```

This shows what files will be included in the package.

### 2. Login to NPM (if not already logged in)
```bash
npm login
```

### 3. Test Package Locally (Optional)
```bash
# Pack the package
npm pack

# This creates js-rag-local-llm-0.6.0.tgz
# You can test it in another project with:
# npm install path/to/js-rag-local-llm-0.6.0.tgz
```

### 4. Publish to NPM
```bash
npm publish
```

This will:
- Run `prepublishOnly` script (runs tests automatically)
- Publish to npm registry as public package
- Package will be available at: https://www.npmjs.com/package/js-rag-local-llm

### 5. Verify Publication
```bash
# Check the published version
npm view js-rag-local-llm version

# See all versions
npm view js-rag-local-llm versions

# Install from npm to test
npm install js-rag-local-llm@0.6.0
```

## 📝 Post-Publish Steps

### 1. Create Git Tag
```bash
git tag -a v0.6.0 -m "Release v0.6.0 - Major performance and feature improvements"
git push origin v0.6.0
```

### 2. Create GitHub Release
Go to: https://github.com/emredeveloper/rag-js-local/releases/new

- Tag: `v0.6.0`
- Title: `v0.6.0 - Performance & Feature Update`
- Description: Copy from CHANGELOG.md

### 3. Update Social Media / Announcements (Optional)
- Tweet about the release
- Post on Reddit r/javascript or r/node
- Share on LinkedIn

## 🔧 Troubleshooting

### If publish fails with "need to login"
```bash
npm login
npm publish
```

### If publish fails with "version already exists"
```bash
# Update version
npm version patch  # 0.6.0 -> 0.6.1
# or
npm version minor  # 0.6.0 -> 0.7.0
# Then publish again
npm publish
```

### If you need to unpublish (within 72 hours)
```bash
npm unpublish js-rag-local-llm@0.6.0
```

⚠️ **Warning**: Unpublishing is not recommended and may not work after 24-72 hours.

## 📊 Expected Output

```
npm notice 
npm notice 📦  js-rag-local-llm@0.6.0
npm notice === Tarball Contents === 
npm notice 1.1kB   LICENSE                            
npm notice 15.2kB  README.md                          
npm notice 846B    package.json                       
npm notice 1.5kB   CHANGELOG.md                       
npm notice 2.1kB   src/index.js                       
npm notice ...     (more files)
npm notice === Tarball Details === 
npm notice name:          js-rag-local-llm                        
npm notice version:       0.6.0                                   
npm notice filename:      js-rag-local-llm-0.6.0.tgz              
npm notice package size:  XX.X kB                                 
npm notice unpacked size: XX.X kB                                 
npm notice shasum:        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
npm notice integrity:     xxxxxxxxxxxxxxxxxxxxx
npm notice total files:   XX                                      
npm notice 
npm notice Publishing to https://registry.npmjs.org/
+ js-rag-local-llm@0.6.0
```

## ✅ Success!

Your package is now published and available at:
- NPM: https://www.npmjs.com/package/js-rag-local-llm
- Installable via: `npm install js-rag-local-llm`

Users can now use all the new v0.6.0 features! 🎉
