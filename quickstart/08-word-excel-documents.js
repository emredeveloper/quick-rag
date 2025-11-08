/**
 * Quick RAG - Word & Excel Documents Example
 * 
 * Shows how to load and query Word (.docx) and Excel (.xlsx) files
 * 
 * Requirements (auto-installed as optional dependencies):
 * - mammoth (for Word documents)
 * - xlsx (for Excel spreadsheets)
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG,
  loadWord,
  loadExcel,
  loadDocument
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - Word & Excel Documents\n');

  try {
    // Initialize
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    // Example 1: Load Word document
    console.log('═'.repeat(70));
    console.log('📄 EXAMPLE 1: Word Document (.docx)');
    console.log('═'.repeat(70) + '\n');

    // Create sample Word-like content (you can replace with actual .docx file path)
    const wordContent = {
      text: `Company Policy Document
      
Employee Benefits Overview

Health Insurance:
All full-time employees are eligible for comprehensive health insurance coverage.
Coverage includes medical, dental, and vision care for employees and their families.

Paid Time Off:
- Vacation Days: 15 days per year for employees with 1-3 years of service
- Sick Leave: 10 days per year
- Personal Days: 5 days per year
- Holidays: 12 paid holidays annually

Retirement Benefits:
The company offers a 401(k) retirement plan with employer matching up to 5% of salary.
Employees are eligible to enroll after 90 days of employment.

Remote Work Policy:
Employees may work remotely up to 2 days per week with manager approval.
All remote work arrangements must be documented and approved in advance.`,
      meta: { 
        source: 'company-policy.docx',
        documentType: 'policy',
        department: 'HR'
      }
    };

    await vectorStore.addDocument(wordContent);
    console.log('✅ Word document content loaded\n');

    // Example 2: Load Excel data
    console.log('═'.repeat(70));
    console.log('📊 EXAMPLE 2: Excel Spreadsheet (.xlsx)');
    console.log('═'.repeat(70) + '\n');

    // Create sample Excel-like content (you can replace with actual .xlsx file path)
    const excelContent = {
      text: `Employee Salary Report - Q4 2024

Department: Engineering
Employee ID | Name | Position | Salary | Years
ENG-001 | John Smith | Senior Developer | $95,000 | 5
ENG-002 | Sarah Johnson | Team Lead | $110,000 | 7
ENG-003 | Mike Chen | Junior Developer | $65,000 | 2

Department: Marketing
Employee ID | Name | Position | Salary | Years
MKT-001 | Lisa Brown | Marketing Manager | $85,000 | 4
MKT-002 | Tom Wilson | Content Specialist | $60,000 | 3

Summary:
Total Employees: 5
Average Salary: $83,000
Highest Salary: $110,000
Lowest Salary: $60,000`,
      meta: { 
        source: 'salary-report-q4.xlsx',
        documentType: 'spreadsheet',
        department: 'Finance',
        quarter: 'Q4-2024'
      }
    };

    await vectorStore.addDocument(excelContent);
    console.log('✅ Excel spreadsheet content loaded\n');

    // Example 3: Mixed document types
    console.log('═'.repeat(70));
    console.log('📋 EXAMPLE 3: Multiple Document Types');
    console.log('═'.repeat(70) + '\n');

    const additionalDocs = [
      {
        text: `Project Proposal: Customer Portal Redesign
        
Objective:
Redesign the customer portal to improve user experience and increase customer satisfaction scores by 25%.

Timeline:
- Phase 1 (Weeks 1-4): User research and requirements gathering
- Phase 2 (Weeks 5-8): Design mockups and prototypes
- Phase 3 (Weeks 9-12): Development and testing
- Phase 4 (Weeks 13-14): Launch and monitoring

Budget:
Development: $150,000
Design: $50,000
Testing: $30,000
Total: $230,000

Key Stakeholders:
- Project Manager: Alice Cooper
- Lead Designer: Bob Martinez
- Tech Lead: Carol Davis`,
        meta: { 
          source: 'project-proposal.docx',
          documentType: 'proposal',
          status: 'approved'
        }
      },
      {
        text: `Meeting Minutes - Product Planning
        
Date: November 7, 2024
Attendees: 12 team members

Discussion Points:
1. Q1 2025 roadmap review
2. New feature prioritization
3. Resource allocation
4. Technical debt management

Key Decisions:
- Mobile app development will be prioritized in Q1
- Allocate 20% of sprint capacity to technical debt
- Hire 2 additional backend developers
- Implement bi-weekly user feedback sessions

Action Items:
- John: Draft technical specifications by Nov 15
- Sarah: Schedule user interviews for next month
- Mike: Prepare resource allocation proposal`,
        meta: { 
          source: 'meeting-minutes-nov7.docx',
          documentType: 'minutes',
          date: '2024-11-07'
        }
      }
    ];

    await vectorStore.addDocuments(additionalDocs);
    console.log(`✅ Added ${additionalDocs.length} additional documents\n`);
    console.log(`📚 Total documents in store: ${2 + additionalDocs.length}\n`);

    // Query 1: Employee benefits
    console.log('═'.repeat(70));
    console.log('🔍 Query 1: Employee Benefits');
    console.log('═'.repeat(70) + '\n');

    const query1 = 'What are the vacation and paid time off policies?';
    console.log(`❓ Question: ${query1}\n`);

    const results1 = await retriever.getRelevant(query1, 2);
    console.log(`📚 Retrieved ${results1.length} relevant document(s)\n`);

    results1.forEach((doc, i) => {
      console.log(`   ${i + 1}. Score: ${doc.score.toFixed(3)} | Source: ${doc.meta.source}`);
      console.log(`      "${doc.text.substring(0, 100).replace(/\n/g, ' ')}..."\n`);
    });

    const response1 = await generateWithRAG(
      client,
      'granite4:3b',
      query1,
      results1.map(d => d.text),
      {
        systemPrompt: 'You are an HR assistant. Provide clear, accurate information about company policies.',
        template: 'qa'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response1.response);
    console.log('-'.repeat(70) + '\n');

    // Query 2: Salary information
    console.log('═'.repeat(70));
    console.log('🔍 Query 2: Salary Information');
    console.log('═'.repeat(70) + '\n');

    const query2 = 'What is the salary range for engineering positions?';
    console.log(`❓ Question: ${query2}\n`);

    const results2 = await retriever.getRelevant(query2, 2);
    
    const response2 = await generateWithRAG(
      client,
      'granite4:3b',
      query2,
      results2.map(d => d.text),
      {
        template: 'concise'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response2.response);
    console.log('-'.repeat(70) + '\n');

    // Query 3: Project information
    console.log('═'.repeat(70));
    console.log('🔍 Query 3: Project Planning');
    console.log('═'.repeat(70) + '\n');

    const query3 = 'What projects are planned and what are their budgets?';
    console.log(`❓ Question: ${query3}\n`);

    const results3 = await retriever.getRelevant(query3, 2);
    
    const response3 = await generateWithRAG(
      client,
      'granite4:3b',
      query3,
      results3.map(d => d.text),
      {
        systemPrompt: 'You are a project management assistant. Provide structured information about projects.',
        template: 'detailed'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response3.response);
    console.log('-'.repeat(70) + '\n');

    // Query 4: Cross-document analysis
    console.log('═'.repeat(70));
    console.log('🔍 Query 4: Cross-Document Analysis');
    console.log('═'.repeat(70) + '\n');

    const query4 = 'Summarize the key information about company operations and planning';
    console.log(`❓ Question: ${query4}\n`);

    const results4 = await retriever.getRelevant(query4, 4);
    console.log(`📚 Retrieved ${results4.length} document(s) from different sources\n`);

    results4.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.meta.source} (${doc.meta.documentType})`);
    });
    console.log();

    const response4 = await generateWithRAG(
      client,
      'granite4:3b',
      query4,
      results4.map(d => d.text),
      {
        systemPrompt: 'You are a business analyst. Provide comprehensive summaries across different document types.',
        template: 'default'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response4.response);
    console.log('-'.repeat(70) + '\n');

    console.log('✅ Word & Excel documents example completed successfully!');
    console.log('\n💡 This example demonstrates:');
    console.log('   • Loading content from Word documents (.docx)');
    console.log('   • Loading data from Excel spreadsheets (.xlsx)');
    console.log('   • Working with multiple document types simultaneously');
    console.log('   • Cross-document querying and analysis');
    console.log('   • Different query types (benefits, salary, projects)');
    console.log('   • Various response templates (qa, concise, detailed)\n');

    console.log('📁 To load actual Word/Excel files:');
    console.log('   const wordDoc = await loadWord("./path/to/file.docx");');
    console.log('   const excelDoc = await loadExcel("./path/to/file.xlsx");');
    console.log('   await vectorStore.addDocuments([wordDoc, excelDoc]);\n');

  } catch (error) {
    if (error.message.includes('mammoth') || error.message.includes('xlsx')) {
      console.error('\n❌ Error: Document parsing module not found');
      console.error('\n📦 To use Word/Excel loading, install:');
      console.error('   npm install mammoth xlsx\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
