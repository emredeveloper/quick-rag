/**
 * Test Excel Loading with exceljs
 * Tests the loadExcel function with the sample XLSX file
 */

import { loadExcel } from '../src/loaders/documents.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testExcel() {
    console.log('🧪 Testing Excel loader with exceljs...\n');

    const xlsxPath = path.join(__dirname, 'XLSX', 'rfm_analysis_results.xlsx');

    console.log(`📁 File: ${xlsxPath}`);
    console.log('⏳ Loading Excel file (this may take a moment for large files)...\n');

    try {
        const startTime = Date.now();

        // Load first sheet only
        const result = await loadExcel(xlsxPath, {
            allSheets: false
        });

        const duration = Date.now() - startTime;

        console.log('✅ Excel loaded successfully!\n');
        console.log('📊 Results:');
        console.log(`   - Sheets found: ${result.meta.sheetNames.join(', ')}`);
        console.log(`   - Text length: ${result.text.length} characters`);
        console.log(`   - First 500 chars of text:`);
        console.log('   ---');
        console.log(result.text.substring(0, 500));
        console.log('   ---');
        console.log(`\n⏱️  Load time: ${duration}ms`);

        // Show some data from sheets
        if (result.sheets) {
            for (const [sheetName, data] of Object.entries(result.sheets)) {
                console.log(`\n📋 Sheet "${sheetName}": ${data.length} rows`);
                if (data.length > 0) {
                    console.log('   First row:', JSON.stringify(data[0]).substring(0, 100) + '...');
                }
            }
        }

        console.log('\n✅ Test PASSED!');

    } catch (err) {
        console.error('❌ Test FAILED:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

testExcel();
