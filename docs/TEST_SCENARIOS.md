# End-to-End Test Scenarios

## Test Environment
- **URL**: http://localhost:3000
- **Database**: PostgreSQL (ils_db)
- **Server**: Node.js Express on port 3000

## 🧪 Test Scenario 1: AI Assistant - First Use

### Objective
Test AI Assistant with no prior knowledge (0% autonomy)

### Steps
1. Log in as ECP/Dispenser user
2. Navigate to "AI Assistant" page
3. Verify learning progress shows 0% or low percentage
4. Ask a general business question: "What products do I sell?"
5. Observe AI response uses external AI
6. Check response metadata shows `usedExternalAi: true`
7. Provide positive feedback (thumbs up)
8. Verify learning progress increased slightly

### Expected Results
- ✅ Learning progress card displays at top
- ✅ AI responds with answer
- ✅ Source badges show "external" type
- ✅ Confidence score displayed
- ✅ Feedback buttons appear
- ✅ Progress increases after feedback

## 🧪 Test Scenario 2: Knowledge Base Upload

### Objective
Upload documents and verify knowledge extraction

### Steps
1. On AI Assistant page, scroll to "Upload Knowledge" section
2. Click file input and select a PDF/DOCX document
3. Click "Upload Document" button
4. Wait for processing confirmation
5. Check "Knowledge Base" section
6. Verify document appears in list
7. Note document category
8. Check learning progress increased

### Expected Results
- ✅ Upload succeeds with success alert
- ✅ Document appears in knowledge base list
- ✅ Filename and date displayed
- ✅ Category badge shown
- ✅ Learning stats updated (document count +1)

## 🧪 Test Scenario 3: Progressive Learning

### Objective
Test AI learning from repeated questions

### Steps
1. Ask the same question twice: "What is my inventory?"
2. First answer should use external AI
3. Provide positive feedback
4. Wait a moment for learning to process
5. Ask the same question again
6. Second answer should show higher confidence
7. Eventually, AI should answer without external AI

### Expected Results
- ✅ First response: external AI used
- ✅ Learning data stored
- ✅ Second response: confidence higher
- ✅ After 3-5 interactions: local answer
- ✅ Autonomy rate increases
- ✅ Source badges show "learned" type

## 🧪 Test Scenario 4: Company Profile Management

### Objective
Edit company profile and verify changes persist

### Steps
1. Navigate to "Company" page
2. Click "Edit" button
3. Update company name
4. Change contact email
5. Update address
6. Change company status
7. Click "Save" button
8. Refresh page
9. Verify changes persist

### Expected Results
- ✅ Edit mode enables all fields
- ✅ Changes save successfully
- ✅ Success alert appears
- ✅ Form returns to view mode
- ✅ Data persists after refresh

## 🧪 Test Scenario 5: Supplier Relationship (Dispenser)

### Objective
Create and manage supplier relationship as dispenser

### Steps
1. Log in as Dispenser user
2. Navigate to "Company" page
3. Click "Add Supplier" button
4. Select a supplier from dropdown
5. Click "Send Request"
6. Verify request appears in list
7. Check status shows "PENDING"
8. Wait for supplier approval

### Expected Results
- ✅ Dialog opens with supplier list
- ✅ Request creates successfully
- ✅ Relationship appears in "Supplier Relationships"
- ✅ Status badge shows "PENDING"
- ✅ Supplier company name displayed

## 🧪 Test Scenario 6: Supplier Approval (Supplier)

### Objective
Approve dispenser relationship request as supplier

### Steps
1. Log in as Supplier user
2. Navigate to "Company" page
3. View "Dispenser Relationships" section
4. Find pending request
5. Click green checkmark (Approve)
6. Verify status changes to "APPROVED"
7. Switch to dispenser account
8. Verify their view shows "APPROVED" status

### Expected Results
- ✅ Pending requests visible
- ✅ Approve/Reject buttons appear
- ✅ Approval updates status immediately
- ✅ Badge changes to green "APPROVED"
- ✅ Both parties see updated status

## 🧪 Test Scenario 7: Data Isolation Test

### Objective
Verify company data isolation (multi-tenancy)

### Steps
1. Create orders as Company A user
2. Note order IDs
3. Log out and log in as Company B user
4. Navigate to orders/dashboard
5. Verify Company A orders NOT visible
6. Create orders as Company B
7. Switch back to Company A
8. Verify Company B orders NOT visible

### Expected Results
- ✅ Each company sees only their data
- ✅ No cross-company data leakage
- ✅ AI Assistant knowledge isolated per company
- ✅ Company relationships properly filtered

## 🧪 Test Scenario 8: Business Intelligence Dashboard

### Objective
View and verify BI insights and KPIs

### Steps
1. Create some test orders (5-10)
2. Add products to inventory
3. Complete some sales transactions
4. Navigate to "BI Dashboard" page
5. View KPI cards at top
6. Check trend indicators
7. Review AI insights section
8. Explore growth opportunities
9. Check for any alerts

### Expected Results
- ✅ KPI cards show metrics (Orders, Revenue, etc.)
- ✅ Trend arrows indicate up/down
- ✅ Percentage changes displayed
- ✅ AI insights generated
- ✅ Impact levels shown (High/Medium/Low)
- ✅ Opportunities list actionable items
- ✅ Alerts display if thresholds met

## 🧪 Test Scenario 9: Multi-Conversation Management

### Objective
Create and manage multiple AI conversations

### Steps
1. On AI Assistant page, start new conversation
2. Ask question: "Show me sales report"
3. Click "New Conversation" button
4. Ask different question: "What is inventory status?"
5. Switch between conversations
6. Verify each maintains context
7. Check conversation titles auto-generated
8. View conversation history

### Expected Results
- ✅ Multiple conversations can be created
- ✅ Conversation list shows all conversations
- ✅ Each conversation maintains separate history
- ✅ Titles generated from first message
- ✅ Click conversation loads messages
- ✅ Messages display correctly

## 🧪 Test Scenario 10: Anomaly Detection

### Objective
Test AI anomaly detection and alerts

### Steps
1. Create normal orders for several days
2. Create an outlier order (very large quantity)
3. Wait for BI to process
4. Navigate to BI Dashboard
5. Check alerts section
6. Verify anomaly detected
7. Review alert severity
8. Check insight details

### Expected Results
- ✅ Anomaly detected by AI
- ✅ Alert appears in alerts section
- ✅ Severity badge shown (Critical/Warning)
- ✅ Alert message describes issue
- ✅ Timestamp displayed
- ✅ Actionable recommendations provided

## 🧪 Test Scenario 11: Demand Forecasting

### Objective
Test ML-based demand forecasting

### Steps
1. API test: `POST /api/ai-intelligence/forecast`
2. Send product ID and forecast period
3. Verify forecast response
4. Check confidence intervals
5. View trend analysis
6. Verify seasonal adjustments

### Expected Results
- ✅ Forecast data returned
- ✅ Multiple algorithms used (Holt-Winters, regression)
- ✅ Confidence intervals provided
- ✅ Trend detected
- ✅ Seasonal patterns identified

## 🧪 Test Scenario 12: Feedback Loop

### Objective
Test AI improvement through feedback

### Steps
1. Ask 10 different questions
2. Provide feedback on each (mix of positive/negative)
3. Note initial confidence scores
4. Check learning progress
5. Ask similar questions again
6. Verify confidence improved
7. Check feedback stored in database
8. Review stats page for feedback metrics

### Expected Results
- ✅ All feedback recorded
- ✅ Positive feedback increases confidence
- ✅ Negative feedback triggers relearning
- ✅ Average rating calculated correctly
- ✅ Stats show feedback count
- ✅ AI adjusts responses based on feedback

## 🧪 Test Scenario 13: Document Processing

### Objective
Verify document content extraction

### Steps
1. Create a test PDF with specific content
2. Upload to AI Assistant
3. After processing, ask question about content
4. Verify AI references the document
5. Check source shows "document" type
6. Verify relevance score displayed
7. Test with different formats (DOCX, TXT, CSV)

### Expected Results
- ✅ All formats processed successfully
- ✅ Content extracted accurately
- ✅ AI answers questions from documents
- ✅ Source attribution correct
- ✅ Relevance scores calculated
- ✅ Multiple documents can be referenced

## 🧪 Test Scenario 14: Real-Time Updates

### Objective
Test WebSocket real-time updates

### Steps
1. Open two browser windows
2. Log in as same user in both
3. In window 1, create an order
4. Verify window 2 updates automatically
5. Test with AI conversations
6. Test with BI dashboard metrics

### Expected Results
- ✅ WebSocket connection established
- ✅ Real-time updates across windows
- ✅ No page refresh needed
- ✅ Data synchronizes instantly

## 🧪 Test Scenario 15: Error Handling

### Objective
Test error handling and user feedback

### Steps
1. Upload file > 10MB (should fail)
2. Upload unsupported file type
3. Ask extremely long question
4. Try to edit another company's data
5. Submit form with missing required fields
6. Test with network disconnected

### Expected Results
- ✅ Clear error messages displayed
- ✅ File size limit enforced
- ✅ File type validation works
- ✅ Authorization errors caught
- ✅ Validation messages helpful
- ✅ Graceful degradation on network issues

## 📊 Performance Testing

### Metrics to Monitor
- Page load time: < 2 seconds
- AI response time: < 5 seconds
- Document upload: < 10 seconds
- API response time: < 500ms
- WebSocket latency: < 100ms

## 🔍 Database Verification Queries

After testing, run these to verify data:

```sql
-- Check AI conversations created
SELECT COUNT(*) FROM ai_conversations;

-- Check learning data stored
SELECT COUNT(*) FROM ai_learning_data;

-- Check knowledge base entries
SELECT COUNT(*) FROM ai_knowledge_base;

-- Check feedback submitted
SELECT COUNT(*) FROM ai_feedback;

-- Check company relationships
SELECT * FROM company_supplier_relationships;

-- Verify data isolation
SELECT company_id, COUNT(*) as order_count 
FROM orders 
GROUP BY company_id;
```

## ✅ Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No TypeScript compilation errors
- ✅ No database errors
- ✅ All UI elements render correctly
- ✅ All API calls succeed
- ✅ Data persists correctly
- ✅ Real-time updates work
- ✅ Security/isolation enforced
- ✅ Performance meets targets

## 🚨 Known Issues to Watch

1. First AI query might be slow (cold start)
2. Large documents may take time to process
3. Ensure company_id exists on all users
4. Migration must be run before testing

## 📝 Test Report Template

```
Test Run Date: [DATE]
Tester: [NAME]
Environment: Local Development

| Scenario | Status | Notes |
|----------|--------|-------|
| AI Assistant First Use | ✅/❌ | |
| Knowledge Upload | ✅/❌ | |
| Progressive Learning | ✅/❌ | |
| Company Management | ✅/❌ | |
| Supplier Relationships | ✅/❌ | |
| Data Isolation | ✅/❌ | |
| BI Dashboard | ✅/❌ | |
| Multi-Conversations | ✅/❌ | |
| Anomaly Detection | ✅/❌ | |
| Demand Forecasting | ✅/❌ | |
| Feedback Loop | ✅/❌ | |
| Document Processing | ✅/❌ | |
| Real-Time Updates | ✅/❌ | |
| Error Handling | ✅/❌ | |

Issues Found: [LIST]
Recommendations: [LIST]
```
