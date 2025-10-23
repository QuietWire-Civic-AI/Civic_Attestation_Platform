# Civic AI Canon Platform (CAP) - Complete User Guide

**Version:** 1.0.0  
**Last Updated:** October 23, 2025  
**Platform:** Civic AI Canon Platform (CAP)  
**Author:** Ashraf Al-hajj & Raasid

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Modules](#4-core-modules)
5. [Chat & Messaging](#5-chat--messaging)
6. [Evidence Management](#6-evidence-management)
7. [Policy Management](#7-policy-management)
8. [Compliance & Violations](#8-compliance--violations)
9. [Review Queue](#9-review-queue)
10. [Analytics & Reporting](#10-analytics--reporting)
11. [Settings & Preferences](#11-settings--preferences)
12. [FAQ & Troubleshooting](#12-faq--troubleshooting)

---

## 1. Introduction

### 1.1 What is CAP?

The Civic AI Canon Platform (CAP) is a comprehensive, enterprise-grade multi-tenant platform designed for managing civic AI governance, compliance, evidence management, and analytics. It provides organizations with powerful tools to:

- **Govern AI Interactions**: Ensure all AI conversations comply with organizational policies
- **Manage Evidence**: Collect, verify, and track evidence with chain of custody
- **Enforce Compliance**: Automatically detect and remediate policy violations
- **Track Performance**: Monitor AI model usage, costs, and effectiveness
- **Collaborate**: Enable team-based review workflows and approvals

### 1.2 Key Features

✅ **Multi-Tenant Architecture** - Complete tenant isolation and data security  
✅ **AI Model Management** - Support for multiple AI providers (OpenAI, Anthropic, Azure, Google)  
✅ **Compliance Automation** - Real-time policy enforcement and violation detection  
✅ **Evidence Chain of Custody** - Blockchain-ready evidence tracking  
✅ **Advanced Analytics** - Comprehensive metrics and reporting  
✅ **Review Workflows** - SLA-based review queues with automatic escalation  
✅ **Multi-Language Support** - English, Arabic, French, Spanish

### 1.3 System Requirements

**For Users:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Stable internet connection
- Minimum screen resolution: 1280x720

**For Administrators:**
- System Manager or Tenant Admin role
- Access to System Settings
- API keys for AI providers (if configuring models)

---

## 2. Getting Started

### 2.1 Accessing the Platform

1. **Navigate to the Platform URL**  
   Open your web browser and go to your organization's CAP URL (e.g., `https://cap.yourcompany.com`)

2. **Login**  
   - Enter your **username** or **email address**
   - Enter your **password**
   - Click **Login**

3. **First-Time Login**  
   - You may be prompted to change your password
   - Set up Two-Factor Authentication (2FA) if required by your organization

### 2.2 Dashboard Overview

After logging in, you'll see the **Main Dashboard** which includes:

- **Navigation Bar** (Top): Quick access to modules and settings
- **Sidebar** (Left): Main menu with module links
- **Dashboard Widgets** (Center): Key metrics and recent activity
- **User Menu** (Top Right): Profile, settings, logout

### 2.3 Navigating the Interface

**Main Modules:**
- 🏢 **CAP Core** - Tenant management, users, system settings
- 🤖 **CAP AI** - AI models, chat sessions, conversations
- 📋 **CAP Compliance** - Policies, violations, review queues
- 📊 **CAP Analytics** - Reports, metrics, dashboards
- ⚙️ **CAP Operations** - Evidence, audits, maintenance

**Quick Actions:**
- Use the **Global Search** (Ctrl+K or Cmd+K) to find any document
- Click the **+ New** button to create records
- Use **Filters** to narrow down lists
- **Export** data using the export buttons in list views

### 2.4 User Profile Setup

1. Click your **profile picture** in the top-right corner
2. Select **My Profile**
3. Complete your profile:
   - **Full Name** and **Display Name**
   - **Department** and **Job Title**
   - **Phone** and **Bio**
   - **Avatar** (upload profile picture)

4. **Configure Preferences:**
   - **UI Preferences:** Theme (Light/Dark/Auto), Language, Font Size
   - **AI Preferences:** Preferred model, response tone, language for AI
   - **Notification Preferences:** Email, Slack, Teams, browser notifications

5. Click **Save**

---

## 3. User Roles & Permissions

### 3.1 Available Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **System Manager** | Full system access | Configure settings, manage all tenants, users, and data |
| **Tenant Admin** | Tenant-level administrator | Manage tenant settings, users, policies within tenant |
| **CAP Manager** | Platform manager | Oversee operations, review queues, compliance |
| **CAP Reviewer** | Content reviewer | Review evidence, approve/reject items in queue |
| **CAP User** | Standard user | Create chat sessions, upload evidence, view assigned items |
| **AI Administrator** | AI configuration manager | Configure AI models, manage API keys, monitor usage |
| **Compliance Officer** | Compliance manager | Manage policies, review violations, run compliance reports |
| **Auditor** | Read-only auditor | View audit logs, compliance events, reports (no edit) |

### 3.2 Permission Levels

- **Read**: View documents and lists
- **Write**: Create and edit documents
- **Create**: Create new documents
- **Delete**: Delete documents
- **Submit**: Submit documents for approval
- **Cancel**: Cancel submitted documents
- **Amend**: Modify cancelled documents

### 3.3 Tenant Isolation

**Important:** CAP enforces strict tenant isolation:
- Users can only access data from their assigned tenant
- All data is automatically filtered by tenant
- Cross-tenant access requires System Manager role
- Tenant switching is not allowed (security feature)

---

## 4. Core Modules

### 4.1 Tenant Management

**For Tenant Admins and System Managers**

#### Viewing Tenant Information

1. Navigate to **CAP Core > Tenant**
2. Click on your tenant name
3. View:
   - Tenant status and plan type
   - User count and license information
   - Feature access and quotas
   - Monthly statistics

#### Managing Tenant Features

1. In the tenant document, scroll to **Features** tab
2. Enable/disable features:
   - Multi-Language Support
   - Advanced Analytics
   - Blockchain Verification
   - Custom Integrations
3. Click **Save**

#### Monitoring Tenant Usage

1. Navigate to **CAP Core > Tenant Monthly Stat**
2. Select the current month
3. View:
   - Total messages sent
   - Evidence items uploaded
   - Violations detected
   - Active sessions count
   - Storage used

### 4.2 User Administration

#### Creating a New User

1. Navigate to **CAP Core > User Administration**
2. Click **+ New**
3. Fill in:
   - **Full Name** and **Email**
   - **Tenant** assignment
   - **Roles** (select from dropdown)
   - **Department** and **Job Title**
4. Click **Save**
5. System sends invitation email to user

#### Managing User Profiles

1. Navigate to **CAP Core > User Profile**
2. Select a user
3. View/Edit:
   - Basic information
   - UI and AI preferences
   - Notification settings
   - Usage statistics

#### Deactivating Users

1. Navigate to **CAP Core > User Administration**
2. Open the user record
3. Set **Status** to "Inactive"
4. Click **Save**
5. User loses access immediately

---

## 5. Chat & Messaging

### 5.1 Starting a Chat Session

1. Navigate to **CAP AI > Chat Session**
2. Click **+ New**
3. Fill in:
   - **Session Title** (optional, auto-generated if blank)
   - **AI Model Configuration** (select preferred model)
   - **Session Type** (General, Research, Compliance, etc.)
4. Click **Save**
5. Session starts in "Active" status

### 5.2 Sending Messages

#### In the Chat Interface:

1. Open an active chat session
2. Type your message in the **message box**
3. (Optional) Attach files using the **📎 Attach** button
4. (Optional) Add citations using **🔗 Citation** button
5. Click **Send** or press **Ctrl+Enter**

#### Message Features:

- **Rich Text Formatting**: Bold, italic, lists, code blocks
- **File Attachments**: Documents, images, PDFs (up to 10MB per file)
- **Citations**: Link to external sources or evidence
- **@Mentions**: Tag users for notifications
- **Reactions**: React to messages with emojis

### 5.3 Compliance Checking

**Automatic Compliance:**
- All messages are automatically checked against active policies
- Violations are flagged in real-time
- Blocking enforcement may prevent message from sending (if policy configured)

**Manual Review:**
1. If a message is flagged, you'll see a **⚠️ Warning** indicator
2. Click the warning to view violation details
3. You can:
   - **Edit** the message to fix the violation
   - **Override** (if you have permission)
   - **Cancel** the message

### 5.4 Managing Chat Sessions

#### Viewing Session Statistics:

1. Open a chat session
2. Click **Statistics** button
3. View:
   - Total messages sent
   - Tokens used
   - Compliance score
   - Violations found
   - Session duration

#### Completing a Session:

1. Open an active chat session
2. Click **Complete Session** button
3. System records:
   - End time
   - Final statistics
   - Compliance report
4. Session status changes to "Completed"

#### Archiving Sessions:

1. Navigate to **CAP AI > Chat Session**
2. Filter by status = "Completed"
3. Select sessions older than retention period
4. Click **Archive** bulk action
5. Archived sessions are read-only

---

## 6. Evidence Management

### 6.1 Creating Evidence Records

1. Navigate to **CAP Operations > Evidence**
2. Click **+ New**
3. Fill in:
   - **Title** (descriptive name)
   - **Evidence Type** (Document, Screenshot, Audio, Video, etc.)
   - **Source Document** (link to chat message, policy, etc.)
   - **Content** (paste text or description)
   - **Tags** (for organization)
4. **Attach Files** (if applicable)
5. Click **Save**

### 6.2 Evidence Verification Workflow

#### Submitting for Verification:

1. Open a draft evidence record
2. Click **Submit for Verification**
3. Evidence status changes to "Pending Verification"
4. Assigned reviewers are notified

#### Verifying Evidence (For Reviewers):

1. Navigate to **CAP Operations > Evidence**
2. Filter: **Status = Pending Verification**
3. Open evidence record
4. Review:
   - Content integrity
   - Source reliability
   - Metadata completeness
5. Click **Verify Evidence**
6. Select **Verification Method** (Manual Review, Automated Check, etc.)
7. Add **Notes** (optional)
8. Click **Submit**

#### Rejecting Evidence:

1. Open pending evidence
2. Click **Reject Verification**
3. Enter **Rejection Reason**
4. Click **Submit**
5. Evidence status changes to "Failed"

### 6.3 Chain of Custody

**Viewing Custody History:**

1. Open any evidence record
2. Scroll to **Chain of Custody** section
3. View timeline of all actions:
   - Created
   - Modified
   - Verified
   - Accessed
   - Archived
4. Each entry shows:
   - **Action** performed
   - **User** who performed it
   - **Timestamp**
   - **IP Address**
   - **Notes**

**Automatic Tracking:**
- Every access is logged
- Content changes trigger new custody entries
- Hash verification on every save
- Tamper detection alerts

### 6.4 Linking Evidence

#### Link to Messages:

1. Open evidence record
2. Scroll to **Related Messages** section
3. Click **+ Add Row**
4. Select **Message**
5. Choose **Relationship Type** (Supporting Evidence, Contradictory, etc.)
6. Click **Save**

#### Link to Policies:

1. Open evidence record
2. Scroll to **Related Policies** section
3. Click **+ Add Row**
4. Select **Policy**
5. Click **Save**

#### Link to Violations:

1. Open evidence record
2. Scroll to **Related Violations** section
3. Click **+ Add Row**
4. Select **Violation**
5. Click **Save**

### 6.5 Evidence Versioning

**Creating New Version:**

1. Open an existing evidence record
2. Click **Create New Version**
3. Enter **Change Summary**
4. Click **Submit**
5. New version is created with incremented revision number
6. Previous version is linked automatically

**Viewing Version History:**

1. Open evidence record
2. Click **Version History** button
3. View all versions in chronological order
4. Click any version to view its content

---

## 7. Policy Management

### 7.1 Understanding Policies

**What are Policies?**
Policies define the rules and governance framework for AI interactions, content, and compliance within the platform.

**Policy Types:**
- **Governance** - Organizational rules and standards
- **Privacy** - Data protection and PII handling
- **Security** - Security controls and requirements
- **Compliance** - Regulatory compliance (GDPR, HIPAA, etc.)
- **Quality** - Content quality and accuracy standards
- **Ethical** - Ethical AI usage guidelines

### 7.2 Creating a Policy

1. Navigate to **CAP Compliance > Policy**
2. Click **+ New**
3. **Basic Information:**
   - **Policy Name**
   - **Policy Type**
   - **Framework** (GDPR, HIPAA, SOC2, ISO27001, etc.)
   - **Severity** (Low, Medium, High, Critical)
4. **Policy Details:**
   - **Description** (detailed explanation)
   - **Rationale** (why this policy exists)
   - **Scope** (where it applies)
5. **Enforcement:**
   - **Enforcement Level** (Advisory, Warning, Blocking, Auto-Remediate)
   - **Violation Action** (Alert, Block, Quarantine)
6. **Lifecycle:**
   - **Effective From** (start date)
   - **Effective Until** (end date, optional)
   - **Review Frequency** (Monthly, Quarterly, Annually)
7. Click **Save**

### 7.3 Policy Lifecycle

```
Draft → Approved → Active → Inactive → Archived
                     ↓
                 Deprecated
```

#### Draft to Approved:

1. Create policy in Draft status
2. Complete all required fields
3. Click **Submit for Approval**
4. Policy is routed to approver
5. Approver reviews and clicks **Approve**

#### Activating a Policy:

1. Open approved policy
2. Click **Activate**
3. Policy becomes enforceable immediately
4. System starts monitoring for violations

#### Deactivating a Policy:

1. Open active policy
2. Click **Deactivate**
3. Enter **Reason** (optional)
4. Policy stops being enforced
5. Historical data remains intact

#### Archiving a Policy:

1. Deactivate policy first
2. Click **Archive**
3. Policy becomes read-only
4. Can be used for historical reference

### 7.4 Policy Configuration

#### Setting Thresholds:

1. Open policy document
2. Scroll to **Threshold Settings** section
3. Configure JSON parameters:
   ```json
   {
     "max_violations_per_session": 3,
     "confidence_threshold": 0.8,
     "alert_threshold": 5
   }
   ```
4. Click **Save**

#### Configuring Rules:

1. Open policy document
2. Scroll to **Policy Rules** table
3. Click **+ Add Row**
4. Configure:
   - **Rule Name**
   - **Rule Type** (Content Filter, Pattern Match, ML Detection)
   - **Pattern** (regex or keywords)
   - **Action** (Alert, Block, Quarantine)
5. Repeat for additional rules
6. Click **Save**

---

## 8. Compliance & Violations

### 8.1 Understanding Violations

**Violation Workflow:**
```
Detection → Investigation → Remediation → Resolution → Closed
              ↓
          Escalation (if needed)
```

**Severity Levels:**
- **Critical** - Immediate threat, requires urgent action (SLA: 8 hours)
- **High** - Significant risk, priority handling (SLA: 24 hours)
- **Medium** - Moderate risk, standard handling (SLA: 72 hours)
- **Low** - Minor issue, routine handling (SLA: 168 hours)
- **Info** - Informational only, no action required

### 8.2 Viewing Violations

1. Navigate to **CAP Compliance > Violation**
2. Use filters:
   - **Status** (Open, Under Investigation, Resolved, etc.)
   - **Severity** (Critical, High, etc.)
   - **Assigned To** (your violations)
   - **Detection Date** (date range)
3. Click on a violation to view details

### 8.3 Investigating Violations

#### For Assigned Reviewers:

1. Open assigned violation
2. Review:
   - **Violation Details**: Type, severity, description
   - **Violated Policies**: Which policies were breached
   - **Evidence**: Related evidence and messages
   - **Context**: Source document and metadata
3. Click **Start Investigation**
4. Status changes to "Under Investigation"

#### Adding Investigation Notes:

1. Open violation
2. Scroll to **Comments** section
3. Click **Add Comment**
4. Type your findings and notes
5. Click **Submit**

#### Linking Evidence:

1. Open violation
2. Scroll to **Related Evidence** section
3. Click **+ Add Evidence**
4. Select evidence document
5. Choose relationship type
6. Click **Save**

### 8.4 Remediation Actions

1. Open violation under investigation
2. Scroll to **Remediation Actions** section
3. Click **+ Add Action**
4. Fill in:
   - **Action Type** (Delete Content, Modify Content, User Training, etc.)
   - **Description**
   - **Assigned To** (who will perform the action)
   - **Due Date**
   - **Status** (Pending, In Progress, Completed)
5. Click **Save**
6. Track progress in the actions table

### 8.5 Resolving Violations

1. Complete all remediation actions
2. Open violation
3. Click **Resolve Violation**
4. Fill in:
   - **Resolution Summary** (what was done)
   - **Resolution Category** (Fixed, False Positive, Accepted Risk, etc.)
5. Click **Submit**
6. Violation status changes to "Resolved"
7. Notifications sent to stakeholders

### 8.6 Escalation

**Automatic Escalation Triggers:**
- SLA breach (deadline passed)
- High/Critical severity with no assignment
- Multiple attempts to remediate failed

**Manual Escalation:**

1. Open violation
2. Click **Escalate**
3. Enter **Escalation Reason**
4. System finds escalation target (manager or compliance officer)
5. Violation reassigned automatically
6. Escalation notifications sent

### 8.7 False Positives

1. Open violation
2. Click **Mark as False Positive**
3. Confirm action
4. Violation status changes to "False Positive"
5. Policy rules may be adjusted to prevent recurrence

---

## 9. Review Queue

### 9.1 Understanding Review Queues

Review Queues manage approval workflows for various content types:
- Evidence verification
- Policy approvals
- Chat content review
- Compliance event resolution

### 9.2 Viewing Your Queue

1. Navigate to **CAP Compliance > Review Queue**
2. Filter by **Assigned To** = Your name
3. View items sorted by:
   - **Priority** (Critical, High, Medium, Low)
   - **SLA Status** (Breached, Warning, On Track)
   - **Due Date** (earliest first)

### 9.3 Processing Review Items

#### Starting Review:

1. Open a pending review item
2. Click **Start Review**
3. Status changes to "In Review"
4. Timer starts for SLA tracking

#### Using Checklists:

1. Open review item
2. Scroll to **Checklist** section
3. Check off completed items:
   - ☐ Content accuracy verified
   - ☐ Source validated
   - ☐ Policy compliance checked
   - ☐ Evidence attached
4. Progress bar updates automatically

#### Making a Decision:

1. Complete all checklist items
2. Click **Make Decision**
3. Select:
   - **Approve** - Item meets requirements
   - **Reject** - Item fails requirements
   - **Request Changes** - Needs modifications
4. Add **Decision Notes**
5. Click **Submit**

#### Rejection Workflow:

1. If rejecting, you must:
   - Select **Rejection Reason** from dropdown
   - Add detailed **Comments**
   - (Optional) Attach supporting evidence
2. Click **Submit**
3. Item is returned to creator with feedback

### 9.4 SLA Management

**Monitoring SLA:**
- **Green** indicator: > 24 hours remaining
- **Orange** indicator: < 24 hours remaining (Warning)
- **Red** indicator: Past due date (Breached)

**Extending SLA:**

1. Open review item
2. Click **Extend SLA**
3. Enter:
   - **Hours to extend**
   - **Reason for extension**
4. Click **Submit**
5. New due date is calculated

**SLA Breach Actions:**
- Automatic notification to manager
- Priority escalation
- Highlighted in dashboard
- May trigger automatic escalation

### 9.5 Collaboration Features

#### Adding Watchers:

1. Open review item
2. Scroll to **Watchers** section
3. Click **+ Add Watcher**
4. Select user
5. Configure notifications:
   - ☑ Notify on update
   - ☑ Notify on SLA breach
   - ☑ Notify on decision
6. Click **Save**

#### Adding Comments:

1. Open review item
2. Scroll to **Comments** section
3. Click **Add Comment**
4. Type comment (supports @mentions)
5. Click **Post**
6. Mentioned users are notified

#### Linking Related Documents:

1. Open review item
2. Scroll to **Related Documents** section
3. Click **+ Add Document**
4. Select document type and name
5. Click **Save**

---

## 10. Analytics & Reporting

### 10.1 Compliance Dashboard

1. Navigate to **CAP Compliance > Compliance Dashboard**
2. View key metrics:
   - **Compliance Score** (overall percentage)
   - **Active Violations** (by severity)
   - **Policy Status** (active vs inactive)
   - **Trend Analysis** (violations over time)

**Widget Details:**
- **Violation Heatmap**: Visual representation by type and time
- **Top Violated Policies**: Policies with most violations
- **Remediation Progress**: Open vs resolved violations
- **SLA Performance**: On-time vs breached reviews

### 10.2 AI Model Usage Reports

1. Navigate to **CAP AI > Model Configuration**
2. Select a model
3. Click **View Statistics**
4. View:
   - **Total Requests** (successful and failed)
   - **Token Usage** (input and output)
   - **Cost Analysis** (by period)
   - **Performance Metrics** (avg response time, success rate)

**Exporting Data:**
1. Click **Export Report**
2. Select format (CSV, Excel, PDF)
3. Choose date range
4. Click **Download**

### 10.3 Tenant Analytics

1. Navigate to **CAP Core > Tenant Monthly Stat**
2. Select reporting period
3. View:
   - **Usage Metrics**: Messages, sessions, evidence uploads
   - **Cost Breakdown**: AI model costs by type
   - **Storage Utilization**: Data growth trends
   - **User Activity**: Active vs inactive users

### 10.4 Audit Logs

1. Navigate to **CAP Operations > Audit Log**
2. Filter by:
   - **User** (who performed action)
   - **Action Type** (create, update, delete, etc.)
   - **Document Type** (Policy, Evidence, etc.)
   - **Date Range**
3. View detailed log entries:
   - Timestamp
   - User
   - Action performed
   - Changes made (before/after)
   - IP address

**Exporting Audit Logs:**
1. Apply desired filters
2. Click **Export**
3. Select format
4. Logs include digital signature for compliance

### 10.5 Custom Reports

1. Navigate to **CAP Analytics > Report Builder**
2. Click **+ New Report**
3. Configure:
   - **Report Name**
   - **Data Source** (Evidence, Violations, Messages, etc.)
   - **Filters** (tenant, date range, status, etc.)
   - **Columns** (select fields to display)
   - **Grouping** (group by field)
   - **Sorting** (order by field)
4. Click **Run Report**
5. (Optional) Click **Save** to reuse report

---

## 11. Settings & Preferences

### 11.1 System Settings (For Administrators)

1. Navigate to **CAP Core > System Settings**
2. Configure using **Tabbed Navigation**:

#### Platform Tab 🏢:
- Platform name and description
- Environment (Production, Staging, Development)
- Maintenance mode toggle
- Contact information

#### AI & Models Tab 🤖:
- Default AI provider
- API keys (encrypted)
- Default models per task
- Rate limits and cost ceilings

#### Security Tab 🔒:
- Encryption algorithm (AES-256, RSA-4096)
- Password policy
- Multi-factor authentication (MFA)
- Session timeout
- IP whitelist

#### Notifications Tab 📧:
- SMTP configuration
- Slack webhook URL
- Microsoft Teams webhook URL
- Email notification toggles

#### Storage Tab 💾:
- Primary storage provider (S3, Azure Blob, GCS)
- Bucket/container configuration
- CDN settings
- Backup schedule and retention

#### Compliance Tab 📋:
- Active frameworks (GDPR, HIPAA, SOC2, ISO27001)
- Risk tolerance level
- Audit schedule
- Auto-violation detection

#### Tenants Tab 👥:
- Multi-tenancy enabled
- Default plan type
- Auto-suspension rules
- Resource quotas

#### Audit & Logs Tab 📊:
- Audit logging enabled
- Log retention period
- Sensitive data masking
- Blockchain verification

### 11.2 Using Configuration Templates

1. Open **System Settings**
2. Click **📋 Load Template**
3. Choose from pre-built templates:
   - **Development Environment**
   - **Production Basic**
   - **Production Enterprise**
   - **High Security**
   - **Multi-Tenant Setup**
4. Click **Load**
5. Review and adjust settings
6. Click **Save**

### 11.3 Personal Preferences

1. Click your profile picture
2. Select **My Settings**
3. Configure:

**UI Preferences:**
- Theme (Light, Dark, Auto)
- Language (English, Arabic, French, Spanish)
- Font size (Small, Medium, Large)
- Dashboard layout
- Items per page

**AI Preferences:**
- Preferred AI model
- Response tone (Formal, Casual, Technical, Friendly)
- Response detail level (Concise, Balanced, Detailed)
- Enable AI suggestions
- Preferred language for AI responses

**Notification Preferences:**
- Email alerts frequency (Instant, Daily Digest, Weekly, Disabled)
- Slack notifications (Critical Only, All, Disabled)
- Teams notifications
- Browser push notifications
- Sound notifications

### 11.4 Language Switcher

**Changing Interface Language:**

1. Click the **language dropdown** in the top navigation
2. Select from:
   - 🇬🇧 English
   - 🇸🇦 العربية (Arabic)
   - 🇫🇷 Français (French)
   - 🇪🇸 Español (Spanish)
3. Interface reloads in selected language
4. Preference is saved to your profile

**RTL Support:**
- Arabic automatically switches to Right-to-Left layout
- All interface elements are mirrored
- Text direction adjusted automatically

---

## 12. FAQ & Troubleshooting

### 12.1 Common Questions

**Q: How do I reset my password?**  
A: Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your inbox.

**Q: Why can't I see certain records?**  
A: This is likely due to tenant isolation or insufficient permissions. Contact your administrator to verify your role and tenant assignment.

**Q: How do I export data?**  
A: In any list view, select the records (or use filters), then click the "Export" button. Choose your format (CSV, Excel, PDF) and download.

**Q: Can I delete a violation?**  
A: No, violations cannot be deleted for compliance audit purposes. You can mark them as "False Positive" or "Resolved" instead.

**Q: How do I change my tenant?**  
A: Tenant assignment is controlled by administrators for security. Contact your System Manager if you need access to a different tenant.

**Q: What happens when I archive a chat session?**  
A: Archived sessions become read-only. They remain searchable but cannot be modified. Related messages are also archived.

**Q: How are AI costs calculated?**  
A: Costs are calculated based on token usage (input + output) multiplied by the model's price per 1,000 tokens. View detailed breakdowns in the Model Configuration statistics.

**Q: Can I undo a policy activation?**  
A: Yes, you can deactivate a policy at any time. Historical data and violation records are preserved.

**Q: How do I know if my evidence is verified?**  
A: Check the "Verification Status" field. "Verified" means it has been reviewed and approved. You can view verification details in the Chain of Custody section.

**Q: What is the difference between "Archive" and "Delete"?**  
A: Archive makes records read-only but preserves them for historical reference. Delete permanently removes records (only allowed for Draft items in most cases).

### 12.2 Troubleshooting

**Issue: "Access Denied" errors**

**Solution:**
1. Verify you're logged in
2. Check your role permissions
3. Confirm you're accessing data from your assigned tenant
4. Contact administrator if issue persists

**Issue: Chat messages not sending**

**Solution:**
1. Check your internet connection
2. Verify the chat session is in "Active" status
3. Check if the message violates any blocking policies
4. Review any warning messages displayed
5. Contact support if error persists

**Issue: AI model not responding**

**Solution:**
1. Check Model Configuration status (should be "Active")
2. Verify API keys are configured correctly
3. Check if rate limits have been exceeded
4. Review Model Configuration health status
5. Contact AI Administrator

**Issue: Evidence upload failing**

**Solution:**
1. Check file size (max 10MB per file)
2. Verify file format is supported
3. Check available storage quota for your tenant
4. Try uploading smaller files
5. Contact administrator if quota exceeded

**Issue: SLA breach notifications not received**

**Solution:**
1. Check your User Profile notification preferences
2. Verify email address is correct
3. Check spam/junk folder
4. Ensure "Send SLA Warnings" is enabled in Review Queue
5. Contact administrator to verify SMTP settings

**Issue: Reports showing no data**

**Solution:**
1. Verify date range filter is correct
2. Check tenant filter is set to your tenant
3. Confirm you have permission to view the data
4. Try clearing filters and reapplying
5. Refresh the page

**Issue: Language not switching**

**Solution:**
1. Ensure you've saved the language selection
2. Clear browser cache and cookies
3. Log out and log back in
4. Try a different browser
5. Contact administrator if issue persists

### 12.3 Performance Tips

1. **Use Filters**: Narrow down large lists using filters to improve loading speed
2. **Limit Results**: Set "Items per page" to a reasonable number (20-50)
3. **Close Inactive Sessions**: Complete or archive chat sessions you're not using
4. **Regular Cleanup**: Archive old evidence and messages periodically
5. **Optimize Searches**: Use specific keywords instead of broad searches
6. **Browser Cache**: Clear cache if experiencing slow performance
7. **Batch Operations**: Use bulk actions instead of processing items one-by-one

### 12.4 Getting Help

**In-App Help:**
- Click the **?** icon next to field labels for contextual help
- Hover over buttons for tooltips
- Click **Help** in the top menu for documentation

**Support Channels:**
- **Email**: support@cap.yourcompany.com
- **Internal Chat**: #cap-support channel
- **Help Desk**: Submit a ticket via the Help menu
- **Training**: Request training sessions from your administrator

**Reporting Bugs:**
1. Navigate to **Help > Report Issue**
2. Fill in:
   - Issue description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
3. Click **Submit**
4. You'll receive a ticket number for tracking

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` (Cmd+K) | Global search |
| `Ctrl+S` (Cmd+S) | Save current document |
| `Ctrl+Enter` | Send message in chat |
| `Esc` | Close dialog/modal |
| `Ctrl+/` | Show keyboard shortcuts help |
| `Alt+N` | Create new document |
| `Alt+E` | Edit current document |
| `Alt+R` | Refresh current page |

## Appendix B: Glossary

**Chain of Custody**: Complete audit trail of evidence handling and access

**Compliance Score**: Percentage of AI interactions that comply with active policies

**Evidence**: Digital artifacts collected for verification and compliance purposes

**Escalation**: Process of routing items to higher authority for resolution

**Policy**: Rule or governance framework enforced on platform activities

**Review Queue**: Workflow management system for approval processes

**SLA (Service Level Agreement)**: Committed timeframe for completing reviews

**Tenant**: Isolated organizational unit within the multi-tenant platform

**Violation**: Instance where content or activity breaches a policy

**Workflow**: Defined sequence of steps for processing items

---

## Document Information

**Version History:**
- v1.0.0 (2025-10-23) - Initial release

**Document Owner:** Ashraf Al-hajj & Raasid  
**Last Review Date:** 2025-10-23  
**Next Review Date:** 2026-01-23

**Feedback:**
To suggest improvements to this guide, contact: documentation@cap.yourcompany.com

---

**End of User Guide**