// AI Document Generator Script
let currentStep = 1;
let selectedDocType = null;
let selectedTemplate = null;
let selectedColor = '#2563eb';
let selectedFont = 'Arial, sans-serif';
let documentData = {};

// New configuration options
let documentConfig = {
    pageCount: 10,
    pageSize: 'a4',
    contentSections: ['executive-summary', 'introduction', 'analysis', 'recommendations', 'conclusion'],
    analysisType: 'basic',
    textColor: '#1a1a1a',
    backgroundColor: '#ffffff',
    accentColor: '#2563eb',
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    lineHeight: '1.5'
};

// Default keywords (normalized) used across SEO suggestions and in-app search
const DEFAULT_SEARCH_KEYWORDS = [
    'pdf ai',
    'firstpage pdf',
    'pdf converter',
    'website report',
    'pdf to ppt',
    'pdf to ppt converter',
    'text to file converter',
    'text to pdf converter',
    'text to doc converter',
    'text to document converter',
    'text to rich text file converter'
];

// Map search phrases to UI targets/pages
const SEARCH_SUGGESTIONS_MAP = {
    'pdf ai': { label: 'AI Document Generator', href: 'ai-generator.html' },
    'firstpage pdf': { label: 'AI Document Generator', href: 'ai-generator.html' },
    'pdf converter': { label: 'PDF to PPT / Converters', href: 'pdf-to-ppt.html' },
    'website report': { label: 'Website Report Generator', href: 'website-report.html' },
    'pdf to ppt': { label: 'PDF to PPT Converter', href: 'pdf-to-ppt.html' },
    'pdf to ppt converter': { label: 'PDF to PPT Converter', href: 'pdf-to-ppt.html' },
    'text to file converter': { label: 'Text → Document tools', href: 'ai-generator.html' },
    'text to pdf converter': { label: 'Export to PDF', href: 'ai-generator.html' },
    'text to doc converter': { label: 'Export to DOC', href: 'ai-generator.html' },
    'text to document converter': { label: 'Export to Document', href: 'ai-generator.html' },
    'text to rich text file converter': { label: 'Rich Text / Formatting', href: 'ai-generator.html' }
};

// Document Templates
const templates = {
    permission: [
        {
            id: 'permission-formal',
            name: 'Formal Permission',
            description: 'Traditional business format',
            fields: ['recipientName', 'recipientTitle', 'organization', 'subject', 'reason', 'duration', 'senderName', 'senderTitle']
        },
        {
            id: 'permission-casual',
            name: 'Casual Permission',
            description: 'Friendly and approachable',
            fields: ['recipientName', 'subject', 'reason', 'senderName']
        },
        {
            id: 'permission-academic',
            name: 'Academic Permission',
            description: 'For educational institutions',
            fields: ['principalName', 'schoolName', 'studentName', 'class', 'reason', 'date', 'parentName']
        }
    ],
    cover: [
        {
            id: 'cover-modern',
            name: 'Modern Professional',
            description: 'Contemporary design',
            fields: ['hiringManager', 'company', 'position', 'introduction', 'experience', 'whyCompany', 'closing', 'yourName', 'email', 'phone']
        },
        {
            id: 'cover-traditional',
            name: 'Traditional Format',
            description: 'Classic business style',
            fields: ['hiringManager', 'company', 'position', 'opening', 'qualifications', 'conclusion', 'yourName', 'address', 'email', 'phone']
        },
        {
            id: 'cover-creative',
            name: 'Creative Style',
            description: 'Stand out from the crowd',
            fields: ['company', 'position', 'hook', 'achievements', 'passion', 'yourName', 'portfolio', 'email']
        }
    ],
    resume: [
        {
            id: 'resume-professional',
            name: 'Professional Resume',
            description: 'Clean and organized',
            fields: ['fullName', 'title', 'email', 'phone', 'location', 'summary', 'experience', 'education', 'skills']
        },
        {
            id: 'resume-creative',
            name: 'Creative Resume',
            description: 'Showcase creativity',
            fields: ['fullName', 'tagline', 'email', 'phone', 'portfolio', 'about', 'experience', 'skills', 'projects']
        },
        {
            id: 'resume-technical',
            name: 'Technical Resume',
            description: 'Tech-focused layout',
            fields: ['fullName', 'title', 'email', 'github', 'linkedin', 'summary', 'technicalSkills', 'experience', 'education', 'certifications']
        }
    ],
    leave: [
        {
            id: 'leave-formal',
            name: 'Formal Leave Request',
            description: 'Official leave application',
            fields: ['managerName', 'leaveType', 'startDate', 'endDate', 'reason', 'contactInfo', 'yourName', 'employeeId']
        },
        {
            id: 'leave-casual',
            name: 'Casual Leave Request',
            description: 'Informal request',
            fields: ['managerName', 'startDate', 'endDate', 'reason', 'yourName']
        },
        {
            id: 'leave-emergency',
            name: 'Emergency Leave',
            description: 'Urgent leave request',
            fields: ['managerName', 'emergencyType', 'startDate', 'duration', 'contactNumber', 'yourName']
        }
    ],
    greeting: [
        {
            id: 'greeting-birthday',
            name: 'Birthday Card',
            description: 'Celebrate birthdays',
            fields: ['recipientName', 'message', 'wishes', 'senderName']
        },
        {
            id: 'greeting-anniversary',
            name: 'Anniversary Card',
            description: 'Celebrate anniversaries',
            fields: ['coupleName', 'years', 'message', 'senderName']
        },
        {
            id: 'greeting-thank-you',
            name: 'Thank You Card',
            description: 'Express gratitude',
            fields: ['recipientName', 'reason', 'message', 'senderName']
        },
        {
            id: 'greeting-congratulations',
            name: 'Congratulations',
            description: 'Celebrate achievements',
            fields: ['recipientName', 'achievement', 'message', 'senderName']
        },
        {
            id: 'greeting-holiday',
            name: 'Holiday Greeting',
            description: 'Seasonal wishes',
            fields: ['recipientName', 'holiday', 'message', 'senderName']
        }
    ],
    business: [
        {
            id: 'business-proposal',
            name: 'Business Proposal',
            description: 'Formal proposal letter',
            fields: ['recipientName', 'company', 'subject', 'proposal', 'benefits', 'nextSteps', 'yourName', 'yourCompany', 'email']
        },
        {
            id: 'business-inquiry',
            name: 'Business Inquiry',
            description: 'Request information',
            fields: ['recipientName', 'company', 'subject', 'inquiry', 'questions', 'yourName', 'yourCompany', 'email']
        },
        {
            id: 'business-complaint',
            name: 'Complaint Letter',
            description: 'Formal complaint',
            fields: ['recipientName', 'company', 'orderNumber', 'issue', 'resolution', 'yourName', 'email', 'phone']
        }
    ]
};

// Field labels and placeholders
const fieldConfig = {
    recipientName: { label: 'Recipient Name', placeholder: 'Mr./Ms. John Doe', type: 'text' },
    recipientTitle: { label: 'Recipient Title', placeholder: 'Manager, HR Department', type: 'text' },
    organization: { label: 'Organization', placeholder: 'ABC Company Ltd.', type: 'text' },
    subject: { label: 'Subject', placeholder: 'Request for Permission', type: 'text' },
    reason: { label: 'Reason', placeholder: 'Explain the reason...', type: 'textarea' },
    duration: { label: 'Duration', placeholder: 'e.g., 3 days, 1 week', type: 'text' },
    senderName: { label: 'Your Name', placeholder: 'Your Full Name', type: 'text' },
    senderTitle: { label: 'Your Title', placeholder: 'Your Position', type: 'text' },
    principalName: { label: "Principal's Name", placeholder: 'Principal Name', type: 'text' },
    schoolName: { label: 'School Name', placeholder: 'School Name', type: 'text' },
    studentName: { label: 'Student Name', placeholder: 'Student Full Name', type: 'text' },
    class: { label: 'Class/Grade', placeholder: 'e.g., 10th Grade', type: 'text' },
    date: { label: 'Date', placeholder: '', type: 'date' },
    parentName: { label: 'Parent Name', placeholder: 'Parent/Guardian Name', type: 'text' },
    hiringManager: { label: 'Hiring Manager', placeholder: 'Hiring Manager Name', type: 'text' },
    company: { label: 'Company Name', placeholder: 'Company Name', type: 'text' },
    position: { label: 'Position', placeholder: 'Job Title', type: 'text' },
    introduction: { label: 'Introduction', placeholder: 'Introduce yourself...', type: 'textarea' },
    experience: { label: 'Relevant Experience', placeholder: 'Highlight your experience...', type: 'textarea' },
    whyCompany: { label: 'Why This Company', placeholder: 'Why you want to join...', type: 'textarea' },
    closing: { label: 'Closing Statement', placeholder: 'Closing remarks...', type: 'textarea' },
    yourName: { label: 'Your Full Name', placeholder: 'Your Name', type: 'text' },
    email: { label: 'Email', placeholder: 'your.email@example.com', type: 'email' },
    phone: { label: 'Phone Number', placeholder: '+1 (555) 000-0000', type: 'tel' },
    address: { label: 'Address', placeholder: 'Your Address', type: 'text' },
    opening: { label: 'Opening Paragraph', placeholder: 'Opening statement...', type: 'textarea' },
    qualifications: { label: 'Qualifications', placeholder: 'Your qualifications...', type: 'textarea' },
    conclusion: { label: 'Conclusion', placeholder: 'Concluding remarks...', type: 'textarea' },
    hook: { label: 'Opening Hook', placeholder: 'Attention-grabbing opening...', type: 'textarea' },
    achievements: { label: 'Key Achievements', placeholder: 'Notable achievements...', type: 'textarea' },
    passion: { label: 'Your Passion', placeholder: 'What drives you...', type: 'textarea' },
    portfolio: { label: 'Portfolio URL', placeholder: 'https://yourportfolio.com', type: 'url' },
    fullName: { label: 'Full Name', placeholder: 'Your Full Name', type: 'text' },
    title: { label: 'Professional Title', placeholder: 'e.g., Software Engineer', type: 'text' },
    location: { label: 'Location', placeholder: 'City, Country', type: 'text' },
    summary: { label: 'Professional Summary', placeholder: 'Brief professional summary...', type: 'textarea' },
    education: { label: 'Education', placeholder: 'Degree, University, Year', type: 'textarea' },
    skills: { label: 'Skills', placeholder: 'Skill 1, Skill 2, Skill 3...', type: 'textarea' },
    tagline: { label: 'Professional Tagline', placeholder: 'Your tagline...', type: 'text' },
    about: { label: 'About You', placeholder: 'Tell about yourself...', type: 'textarea' },
    projects: { label: 'Projects', placeholder: 'Notable projects...', type: 'textarea' },
    github: { label: 'GitHub', placeholder: 'github.com/username', type: 'url' },
    linkedin: { label: 'LinkedIn', placeholder: 'linkedin.com/in/username', type: 'url' },
    technicalSkills: { label: 'Technical Skills', placeholder: 'Programming languages, tools...', type: 'textarea' },
    certifications: { label: 'Certifications', placeholder: 'Relevant certifications...', type: 'textarea' },
    managerName: { label: 'Manager Name', placeholder: "Manager's Name", type: 'text' },
    leaveType: { label: 'Leave Type', placeholder: 'e.g., Annual Leave, Sick Leave', type: 'text' },
    startDate: { label: 'Start Date', placeholder: '', type: 'date' },
    endDate: { label: 'End Date', placeholder: '', type: 'date' },
    contactInfo: { label: 'Contact Information', placeholder: 'Emergency contact...', type: 'text' },
    employeeId: { label: 'Employee ID', placeholder: 'Your Employee ID', type: 'text' },
    emergencyType: { label: 'Emergency Type', placeholder: 'Nature of emergency', type: 'text' },
    contactNumber: { label: 'Contact Number', placeholder: 'Emergency contact number', type: 'tel' },
    message: { label: 'Personal Message', placeholder: 'Your heartfelt message...', type: 'textarea' },
    wishes: { label: 'Wishes', placeholder: 'Special wishes...', type: 'textarea' },
    coupleName: { label: 'Couple Name', placeholder: 'Names of the couple', type: 'text' },
    years: { label: 'Years', placeholder: 'Number of years', type: 'number' },
    achievement: { label: 'Achievement', placeholder: 'What they achieved...', type: 'text' },
    holiday: { label: 'Holiday', placeholder: 'e.g., Christmas, New Year', type: 'text' },
    proposal: { label: 'Proposal Details', placeholder: 'Your proposal...', type: 'textarea' },
    benefits: { label: 'Benefits', placeholder: 'Benefits of your proposal...', type: 'textarea' },
    nextSteps: { label: 'Next Steps', placeholder: 'Proposed next steps...', type: 'textarea' },
    yourCompany: { label: 'Your Company', placeholder: 'Your Company Name', type: 'text' },
    inquiry: { label: 'Inquiry', placeholder: 'Your inquiry...', type: 'textarea' },
    questions: { label: 'Specific Questions', placeholder: 'Questions you have...', type: 'textarea' },
    orderNumber: { label: 'Order/Reference Number', placeholder: 'Order #12345', type: 'text' },
    issue: { label: 'Issue/Problem', placeholder: 'Describe the issue...', type: 'textarea' },
    resolution: { label: 'Desired Resolution', placeholder: 'What resolution you seek...', type: 'textarea' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeColorPicker();
    initializeFontSelect();
    setupSearch();
});

function setupEventListeners() {
    // Document type selection
    document.querySelectorAll('.doc-type-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedDocType = card.dataset.type;
            document.querySelectorAll('.doc-type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            setTimeout(() => goToStep(2), 300);
        });
    });

    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateDocument);
    }
}

function initializeColorPicker() {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            selectedColor = swatch.dataset.color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            updatePreview();
        });
    });
    // Select first color by default
    document.querySelector('.color-swatch')?.classList.add('selected');
}

function initializeFontSelect() {
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            selectedFont = e.target.value;
            updatePreview();
        });
    }
}

function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.step-container').forEach(container => {
        container.classList.add('hidden');
    });
    
    // Show current step
    document.getElementById(`step${step}`).classList.remove('hidden');
    currentStep = step;
    
    // Load content for step
    if (step === 2) {
        loadTemplates();
    } else if (step === 3) {
        loadCustomization();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadTemplates() {
    const templateGrid = document.getElementById('templateGrid');
    const docTemplates = templates[selectedDocType] || [];
    
    templateGrid.innerHTML = docTemplates.map(template => `
        <div class="template-card" data-template="${template.id}">
            <div class="template-preview">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">${getTemplatePreviewTitle(selectedDocType)}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">${template.description}</div>
            </div>
            <div class="template-name">${template.name}</div>
            <div class="template-desc">${template.description}</div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const templateId = card.dataset.template;
            selectedTemplate = docTemplates.find(t => t.id === templateId);
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            setTimeout(() => goToStep(3), 300);
        });
    });
}

function getTemplatePreviewTitle(docType) {
    const titles = {
        permission: 'Permission Letter',
        cover: 'Cover Letter',
        resume: 'Professional Resume',
        leave: 'Leave Application',
        greeting: 'Greeting Card',
        business: 'Business Letter'
    };
    return titles[docType] || 'Document';
}

function loadCustomization() {
    const contentForm = document.getElementById('contentForm');
    
    if (!selectedTemplate) return;
    
    contentForm.innerHTML = selectedTemplate.fields.map(fieldName => {
        const config = fieldConfig[fieldName];
        if (!config) return '';
        
        if (config.type === 'textarea') {
            return `
                <div class="form-group">
                    <label>${config.label}</label>
                    <div class="input-with-ai">
                        <textarea 
                            id="field_${fieldName}" 
                            placeholder="${config.placeholder}"
                            data-field="${fieldName}"
                        ></textarea>
                        <button type="button" class="ai-suggest-btn" onclick="suggestContent('field_${fieldName}')" title="AI Generate Content">✨ AI</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="form-group">
                    <label>${config.label}</label>
                    <div class="input-with-ai">
                        <input 
                            type="${config.type}" 
                            id="field_${fieldName}" 
                            placeholder="${config.placeholder}"
                            data-field="${fieldName}"
                        />
                        <button type="button" class="ai-suggest-btn" onclick="suggestContent('field_${fieldName}')" title="AI Suggestion">✨ AI</button>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Add input listeners
    contentForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            documentData[input.dataset.field] = input.value;
            updatePreview();
        });
    });
    
    // Initial preview
    updatePreview();
}

function updatePreview() {
    const preview = document.getElementById('documentPreview');
    if (!preview) return;
    
    const previewContent = generatePreviewContent();
    preview.innerHTML = previewContent;
    preview.style.fontFamily = selectedFont;
    preview.style.color = selectedColor === '#ffffff' ? '#000000' : '#374151';
}

function generatePreviewContent() {
    if (!selectedTemplate) return '<p style="color: #9ca3af;">Select a template to see preview...</p>';
    
    const docType = selectedDocType;
    const templateId = selectedTemplate.id;
    
    // Generate content based on document type
    if (docType === 'greeting') {
        return generateGreetingPreview();
    } else if (docType === 'resume') {
        return generateResumePreview();
    } else {
        return generateLetterPreview();
    }
}

function generateGreetingPreview() {
    const recipientName = documentData.recipientName || '[Recipient Name]';
    const message = documentData.message || '[Your heartfelt message will appear here]';
    const senderName = documentData.senderName || '[Your Name]';
    
    let icon = '🎉';
    let greeting = 'Congratulations!';
    
    if (selectedTemplate.id.includes('birthday')) {
        icon = '🎂';
        greeting = 'Happy Birthday!';
    } else if (selectedTemplate.id.includes('anniversary')) {
        icon = '💑';
        greeting = 'Happy Anniversary!';
    } else if (selectedTemplate.id.includes('thank')) {
        icon = '🙏';
        greeting = 'Thank You!';
    } else if (selectedTemplate.id.includes('holiday')) {
        icon = '🎄';
        greeting = documentData.holiday ? `Happy ${documentData.holiday}!` : 'Season\'s Greetings!';
    }
    
    return `
        <div class="greeting-card-preview" style="background: linear-gradient(135deg, ${selectedColor}22 0%, ${selectedColor}44 100%);">
            <div class="greeting-icon">${icon}</div>
            <div class="greeting-message" style="color: ${selectedColor};">${greeting}</div>
            <div class="greeting-recipient" style="font-size: 1.2rem; margin: 1rem 0;">
                Dear ${recipientName},
            </div>
            <div class="greeting-content">${message}</div>
            ${documentData.wishes ? `<div style="margin: 1rem 0;">${documentData.wishes}</div>` : ''}
            <div class="greeting-from">
                <div style="margin-top: 2rem;">With warm regards,</div>
                <div style="font-weight: 600; margin-top: 0.5rem;">${senderName}</div>
            </div>
        </div>
    `;
}

function generateResumePreview() {
    const fullName = documentData.fullName || '[Your Name]';
    const title = documentData.title || documentData.tagline || '[Professional Title]';
    const email = documentData.email || '[email@example.com]';
    const phone = documentData.phone || '[Phone Number]';
    
    return `
        <div class="preview-header">
            <h2 style="color: ${selectedColor}; margin: 0; font-size: 2rem;">${fullName}</h2>
            <p style="color: #6b7280; margin: 0.5rem 0;">${title}</p>
            <p style="font-size: 0.9rem; color: #6b7280;">
                ${email} | ${phone}
                ${documentData.location ? ` | ${documentData.location}` : ''}
            </p>
            ${documentData.linkedin ? `<p style="font-size: 0.9rem;"><a href="https://${documentData.linkedin}" style="color: ${selectedColor};">LinkedIn</a></p>` : ''}
            ${documentData.github ? `<p style="font-size: 0.9rem;"><a href="https://${documentData.github}" style="color: ${selectedColor};">GitHub</a></p>` : ''}
            ${documentData.portfolio ? `<p style="font-size: 0.9rem;"><a href="${documentData.portfolio}" style="color: ${selectedColor};">Portfolio</a></p>` : ''}
        </div>
        
        ${documentData.summary || documentData.about ? `
            <div class="resume-section">
                <h4 style="color: ${selectedColor};">${documentData.about ? 'ABOUT' : 'PROFESSIONAL SUMMARY'}</h4>
                <p>${documentData.summary || documentData.about || ''}</p>
            </div>
        ` : ''}
        
        ${documentData.experience ? `
            <div class="resume-section">
                <h4 style="color: ${selectedColor};">EXPERIENCE</h4>
                <div>${documentData.experience.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
            </div>
        ` : ''}
        
        ${documentData.education ? `
            <div class="resume-section">
                <h4 style="color: ${selectedColor};">EDUCATION</h4>
                <div>${documentData.education.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
            </div>
        ` : ''}
        
        ${documentData.skills || documentData.technicalSkills ? `
            <div class="resume-section">
                <h4 style="color: ${selectedColor};">SKILLS</h4>
                <p>${documentData.skills || documentData.technicalSkills || ''}</p>
            </div>
        ` : ''}
        
        ${documentData.projects ? `
            <div class="resume-section">
                <h4 style="color: ${selectedColor};">PROJECTS</h4>
                <div>${documentData.projects.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
            </div>
        ` : ''}
        
        ${documentData.certifications ? `
            <div class="resume-section">
                <h4 style="color: ${selectedColor};">CERTIFICATIONS</h4>
                <p>${documentData.certifications}</p>
            </div>
        ` : ''}
    `;
}

function generateLetterPreview() {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let content = '';
    
    // Header
    if (documentData.yourName || documentData.address || documentData.email) {
        content += `<div style="margin-bottom: 2rem;">`;
        if (documentData.yourName) content += `<div style="font-weight: 600;">${documentData.yourName}</div>`;
        if (documentData.address) content += `<div>${documentData.address}</div>`;
        if (documentData.email) content += `<div>${documentData.email}</div>`;
        if (documentData.phone) content += `<div>${documentData.phone}</div>`;
        content += `</div>`;
    }
    
    content += `<div class="preview-date" style="margin-bottom: 2rem;">${today}</div>`;
    
    // Recipient
    if (documentData.recipientName || documentData.company || documentData.hiringManager || documentData.managerName || documentData.principalName) {
        content += `<div style="margin-bottom: 2rem;">`;
        const recipient = documentData.recipientName || documentData.hiringManager || documentData.managerName || documentData.principalName;
        if (recipient) content += `<div style="font-weight: 600;">${recipient}</div>`;
        if (documentData.recipientTitle) content += `<div>${documentData.recipientTitle}</div>`;
        if (documentData.company || documentData.organization || documentData.schoolName) {
            content += `<div>${documentData.company || documentData.organization || documentData.schoolName}</div>`;
        }
        content += `</div>`;
    }
    
    // Subject
    if (documentData.subject) {
        content += `<div style="margin-bottom: 2rem; font-weight: 600;">Subject: ${documentData.subject}</div>`;
    }
    
    // Greeting
    const recipientFirstName = (documentData.recipientName || documentData.hiringManager || documentData.managerName || documentData.principalName || 'Sir/Madam').split(' ')[0];
    content += `<div style="margin-bottom: 1rem;">Dear ${recipientFirstName},</div>`;
    
    // Body
    content += `<div class="preview-body">`;
    
    // Add all text areas and relevant fields
    selectedTemplate.fields.forEach(field => {
        if (documentData[field] && fieldConfig[field]?.type === 'textarea') {
            content += `<p style="margin-bottom: 1rem; text-align: justify;">${documentData[field]}</p>`;
        }
    });
    
    // Add other relevant single-line fields in context
    if (documentData.duration) {
        content += `<p>Duration: ${documentData.duration}</p>`;
    }
    if (documentData.startDate && documentData.endDate) {
        content += `<p>Leave Period: ${documentData.startDate} to ${documentData.endDate}</p>`;
    }
    if (documentData.leaveType) {
        content += `<p>Leave Type: ${documentData.leaveType}</p>`;
    }
    
    content += `</div>`;
    
    // Closing
    content += `
        <div class="preview-signature">
            <p>Sincerely,</p>
            <p style="font-weight: 600; margin-top: 1rem;">${documentData.senderName || documentData.yourName || documentData.parentName || '[Your Name]'}</p>
            ${documentData.senderTitle ? `<p>${documentData.senderTitle}</p>` : ''}
            ${documentData.employeeId ? `<p>Employee ID: ${documentData.employeeId}</p>` : ''}
            ${documentData.studentName && selectedDocType === 'permission' ? `<p>Student: ${documentData.studentName}</p>` : ''}
            ${documentData.class ? `<p>Class: ${documentData.class}</p>` : ''}
        </div>
    `;
    
    return `<div class="preview-header" style="border-color: ${selectedColor};"></div>${content}`;
}

function generateDocument() {
    if (!validateForm()) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set font
        doc.setFont('helvetica');
        
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        
        // Helper function to add text with word wrap
        const addText = (text, size, style = 'normal', color = [0, 0, 0], align = 'left') => {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            doc.setTextColor(...color);
            
            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                if (yPos > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPos = 20;
                }
                
                if (align === 'center') {
                    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
                } else {
                    doc.text(line, margin, yPos);
                }
                yPos += size * 0.5;
            });
            yPos += 5;
        };
        
        // Convert hex color to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : [37, 99, 235];
        };
        
        const primaryColor = hexToRgb(selectedColor);
        
        // Generate content based on document type
        if (selectedDocType === 'greeting') {
            generateGreetingPDF(doc, addText, primaryColor);
        } else if (selectedDocType === 'resume') {
            generateResumePDF(doc, addText, primaryColor);
        } else {
            generateLetterPDF(doc, addText, primaryColor);
        }
        
        // Save the PDF
        // If user requested SEO section and suggestions exist, add SEO page
        if (documentConfig.contentSections && documentConfig.contentSections.includes('seo') && documentConfig.seoResults) {
            doc.addPage();
            let y = 20;
            doc.setFontSize(18);
            doc.setTextColor(...hexToRgb(documentConfig.accentColor));
            doc.text('SEO Suggestions', pageWidth / 2, y, { align: 'center' });
            y += 12;
            doc.setFontSize(12);
            doc.setTextColor(...hexToRgb(documentConfig.textColor));
            documentConfig.seoResults.forEach(s => {
                const lines = doc.splitTextToSize(s, maxWidth);
                lines.forEach(line => {
                    if (y > doc.internal.pageSize.getHeight() - 20) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, margin, y);
                    y += 7;
                });
                y += 4;
            });
        }

        const fileName = `${selectedDocType}_${Date.now()}.pdf`;
        doc.save(fileName);
        
        showNotification('Document generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating document:', error);
        showNotification('Error generating document. Please try again.', 'error');
    }
}

function generateGreetingPDF(doc, addText, primaryColor) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Background color
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.1);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add decorative border
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
    
    let yPos = pageHeight / 4;
    
    // Greeting
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    
    let greeting = 'Congratulations!';
    if (selectedTemplate.id.includes('birthday')) greeting = 'Happy Birthday!';
    else if (selectedTemplate.id.includes('anniversary')) greeting = 'Happy Anniversary!';
    else if (selectedTemplate.id.includes('thank')) greeting = 'Thank You!';
    else if (selectedTemplate.id.includes('holiday')) greeting = documentData.holiday ? `Happy ${documentData.holiday}!` : 'Season\'s Greetings!';
    
    doc.text(greeting, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    // Recipient
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Dear ${documentData.recipientName || '[Recipient Name]'},`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Message
    doc.setFontSize(12);
    const messageLines = doc.splitTextToSize(documentData.message || '', pageWidth - 60);
    messageLines.forEach(line => {
        doc.text(line, pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
    });
    
    yPos += 10;
    
    // Wishes
    if (documentData.wishes) {
        const wishLines = doc.splitTextToSize(documentData.wishes, pageWidth - 60);
        wishLines.forEach(line => {
            doc.text(line, pageWidth / 2, yPos, { align: 'center' });
            yPos += 7;
        });
    }
    
    // Sender
    yPos += 20;
    doc.setFont('helvetica', 'italic');
    doc.text('With warm regards,', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(documentData.senderName || '[Your Name]', pageWidth / 2, yPos, { align: 'center' });
}

function generateResumePDF(doc, addText, primaryColor) {
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(documentData.fullName || '[Your Name]', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const title = documentData.title || documentData.tagline || '[Professional Title]';
    doc.text(title, 105, 28, { align: 'center' });
    
    const contactInfo = [documentData.email, documentData.phone, documentData.location].filter(Boolean).join(' | ');
    doc.setFontSize(10);
    doc.text(contactInfo, 105, 35, { align: 'center' });
    
    let yPos = 45;
    
    // Add line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Sections
    const sections = [
        { title: 'PROFESSIONAL SUMMARY', content: documentData.summary || documentData.about },
        { title: 'EXPERIENCE', content: documentData.experience },
        { title: 'EDUCATION', content: documentData.education },
        { title: 'SKILLS', content: documentData.skills || documentData.technicalSkills },
        { title: 'PROJECTS', content: documentData.projects },
        { title: 'CERTIFICATIONS', content: documentData.certifications }
    ];
    
    sections.forEach(section => {
        if (section.content) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text(section.title, 20, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const lines = doc.splitTextToSize(section.content, 170);
            lines.forEach(line => {
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 20, yPos);
                yPos += 5;
            });
            yPos += 5;
        }
    });
}

function generateLetterPDF(doc, addText, primaryColor) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Sender info
    if (documentData.yourName) addText(documentData.yourName, 11, 'bold');
    if (documentData.address) addText(documentData.address, 10);
    if (documentData.email) addText(documentData.email, 10);
    if (documentData.phone) addText(documentData.phone, 10);
    
    // Date
    addText(today, 10, 'normal', [100, 100, 100]);
    
    // Recipient
    const recipient = documentData.recipientName || documentData.hiringManager || documentData.managerName || documentData.principalName;
    if (recipient) addText(recipient, 11, 'bold');
    if (documentData.recipientTitle) addText(documentData.recipientTitle, 10);
    if (documentData.company || documentData.organization || documentData.schoolName) {
        addText(documentData.company || documentData.organization || documentData.schoolName, 10);
    }
    
    // Subject
    if (documentData.subject) {
        addText(`Subject: ${documentData.subject}`, 11, 'bold', primaryColor);
    }
    
    // Greeting
    const recipientFirstName = (recipient || 'Sir/Madam').split(' ')[0];
    addText(`Dear ${recipientFirstName},`, 11);
    
    // Body - add all textarea fields
    selectedTemplate.fields.forEach(field => {
        if (documentData[field] && fieldConfig[field]?.type === 'textarea') {
            addText(documentData[field], 11, 'normal', [0, 0, 0], 'left');
        }
    });
    
    // Additional fields
    if (documentData.duration) addText(`Duration: ${documentData.duration}`, 10);
    if (documentData.startDate && documentData.endDate) {
        addText(`Leave Period: ${documentData.startDate} to ${documentData.endDate}`, 10);
    }
    
    // Closing
    addText('Sincerely,', 11);
    addText(documentData.senderName || documentData.yourName || documentData.parentName || '[Your Name]', 11, 'bold');
    if (documentData.senderTitle) addText(documentData.senderTitle, 10);
    if (documentData.employeeId) addText(`Employee ID: ${documentData.employeeId}`, 10);
}

function validateForm() {
    // Check if at least some key fields are filled
    if (Object.keys(documentData).length === 0) return false;
    
    // Check for required fields based on document type
    const requiredFields = {
        permission: ['recipientName', 'reason', 'senderName'],
        cover: ['company', 'position', 'yourName'],
        resume: ['fullName', 'email'],
        leave: ['managerName', 'startDate', 'endDate', 'yourName'],
        greeting: ['recipientName', 'message', 'senderName'],
        business: ['recipientName', 'company', 'yourName']
    };
    
    const required = requiredFields[selectedDocType] || [];
    return required.every(field => documentData[field] && documentData[field].trim() !== '');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">${type === 'success' ? '✓' : '✗'}</div>
        <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// AI Content Suggestion System
const aiSuggestions = {
    permission: {
        recipientName: ['Mr. John Smith', 'Dr. Sarah Johnson', 'Ms. Emily Davis'],
        recipientTitle: ['Manager', 'Director', 'Principal', 'Head of Department'],
        organization: ['ABC Corporation', 'Tech Solutions Inc.', 'Global Enterprises'],
        subject: ['Request for Permission to Attend Conference', 'Permission for Leave of Absence', 'Request for Remote Work Permission'],
        reason: ['I would like to request permission to attend the Annual Technology Conference in San Francisco from March 15-17, 2025. This conference will provide valuable insights into emerging technologies and industry trends that will benefit our team.', 'I am writing to request permission for a brief leave of absence due to personal matters that require my immediate attention.', 'I would like to request permission to work remotely for the next two weeks to better manage my personal commitments while maintaining my work responsibilities.'],
        duration: ['3 days', '1 week', '2 weeks', '1 month'],
        senderName: ['John Doe', 'Jane Smith', 'Michael Brown'],
        principalName: ['Dr. Robert Wilson', 'Mrs. Patricia Anderson', 'Mr. David Martinez'],
        schoolName: ['Lincoln High School', 'Washington Elementary', 'Jefferson Academy'],
        studentName: ['Emily Johnson', 'Michael Chen', 'Sarah Williams'],
        parentName: ['Mr. Robert Johnson', 'Mrs. Linda Chen', 'Mr. James Williams']
    },
    cover: {
        hiringManager: ['Hiring Manager', 'Dear Hiring Team', 'Dear Recruitment Manager'],
        company: ['Google', 'Microsoft', 'Amazon', 'Tesla', 'Apple'],
        position: ['Software Engineer', 'Marketing Manager', 'Data Analyst', 'Product Manager', 'UX Designer'],
        introduction: ['I am writing to express my strong interest in the [position] position at [company]. With [X] years of experience in [field], I am confident that my skills and passion make me an excellent fit for your team.', 'I am excited to apply for the [position] role at [company]. My background in [field] and proven track record of [achievement] align perfectly with the requirements outlined in the job posting.'],
        experience: ['In my current role at [Company], I have successfully led multiple projects that resulted in [specific outcomes]. I have developed expertise in [skills] and consistently delivered results that exceeded expectations.', 'Throughout my career, I have gained extensive experience in [field], working on diverse projects that have honed my skills in [specific areas]. My ability to [key strength] has been instrumental in driving success.'],
        whyCompany: ['I am particularly drawn to [Company] because of your commitment to innovation and your impact on [industry/field]. Your recent work on [project/initiative] aligns perfectly with my professional goals and values.', '[Company]\'s reputation for fostering talent and pushing the boundaries of [field] makes it my top choice for career growth.'],
        closing: ['Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can contribute to your team\'s success.', 'I would welcome the chance to discuss how I can add value to your organization. Thank you for your time and consideration.'],
        yourName: ['Alex Johnson', 'Sarah Miller', 'David Wilson'],
        portfolio: ['https://portfolio.example.com', 'https://github.com/username', 'https://dribbble.com/username']
    },
    resume: {
        fullName: ['John Michael Doe', 'Sarah Elizabeth Smith', 'Michael Anthony Chen'],
        title: ['Senior Software Engineer', 'Marketing Manager', 'Data Scientist', 'Product Designer', 'Financial Analyst'],
        email: ['john.doe@email.com', 'sarah.smith@email.com', 'michael.chen@email.com'],
        phone: ['+1 (555) 123-4567', '+1 (555) 987-6543', '+1 (555) 246-8135'],
        location: ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA'],
        summary: ['Experienced software engineer with 5+ years of expertise in full-stack development. Proven track record of building scalable applications and leading cross-functional teams to deliver high-quality solutions.', 'Results-driven marketing professional with 7+ years of experience in digital marketing, brand strategy, and customer acquisition. Skilled in data-driven decision making and campaign optimization.', 'Detail-oriented data scientist with strong analytical skills and 4+ years of experience in machine learning, statistical modeling, and data visualization.'],
        experience: ['Senior Software Engineer | Tech Corp | 2020-Present\n• Led development of microservices architecture serving 1M+ users\n• Improved system performance by 40% through optimization\n• Mentored team of 5 junior developers', 'Software Engineer | StartUp Inc | 2018-2020\n• Developed and maintained web applications using React and Node.js\n• Collaborated with product team to define and implement features\n• Reduced bug count by 30% through improved testing practices'],
        education: ['Bachelor of Science in Computer Science\nStanford University | 2014-2018 | GPA: 3.8/4.0', 'Master of Business Administration\nHarvard Business School | 2018-2020', 'Bachelor of Arts in Marketing\nUniversity of California, Berkeley | 2015-2019'],
        skills: ['JavaScript, Python, React, Node.js, AWS, Docker, SQL, MongoDB, Git, Agile', 'Digital Marketing, SEO, Content Strategy, Google Analytics, Social Media Marketing, Email Marketing', 'Python, R, Machine Learning, TensorFlow, SQL, Tableau, Statistics, Data Visualization'],
        technicalSkills: ['Languages: Python, Java, JavaScript, C++, SQL\nFrameworks: React, Angular, Django, Spring Boot\nTools: Git, Docker, Kubernetes, Jenkins, AWS\nDatabases: PostgreSQL, MongoDB, Redis'],
        certifications: ['AWS Certified Solutions Architect\nGoogle Cloud Professional\nScrum Master Certification']
    },
    leave: {
        managerName: ['Mr. Johnson', 'Ms. Davis', 'Dr. Smith'],
        leaveType: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Emergency Leave', 'Bereavement Leave'],
        reason: ['I would like to request leave to attend a family wedding in another state.', 'I am requesting sick leave as I am experiencing health issues that require rest and medical attention.', 'I need to take emergency leave due to an unexpected family situation that requires my immediate presence.', 'I would like to request annual leave to spend time with my family during the holiday season.'],
        contactInfo: ['Available at +1 (555) 123-4567', 'Emergency contact: +1 (555) 987-6543', 'Email: john.doe@email.com'],
        employeeId: ['EMP12345', 'EMP98765', 'EMP54321'],
        emergencyType: ['Family Medical Emergency', 'Personal Emergency', 'Home Emergency'],
        contactNumber: ['+1 (555) 123-4567', '+1 (555) 987-6543', '+1 (555) 246-8135']
    },
    greeting: {
        recipientName: ['Sarah', 'Michael', 'Emily', 'David', 'Jessica'],
        message: ['Wishing you a day filled with love, laughter, and wonderful memories. May this special day bring you joy and happiness!', 'Congratulations on your amazing achievement! Your hard work and dedication have truly paid off. Wishing you continued success!', 'Thank you so much for everything you do. Your kindness and support mean the world to me. I am truly grateful to have you in my life.'],
        wishes: ['May all your dreams come true and may you find happiness in everything you do!', 'Wishing you success, health, and prosperity in all your endeavors!', 'May this occasion bring you closer to your goals and fill your life with joy!'],
        coupleName: ['John and Sarah', 'Michael and Emily', 'David and Jessica'],
        years: ['1', '5', '10', '25', '50'],
        achievement: ['graduation', 'promotion', 'new job', 'new home', 'new baby'],
        holiday: ['Christmas', 'New Year', 'Thanksgiving', 'Easter', 'Diwali']
    },
    business: {
        company: ['ABC Corporation', 'Tech Solutions Inc.', 'Global Enterprises Ltd.', 'Innovation Labs'],
        proposal: ['We are pleased to present our proposal for [project/service]. Our solution offers [key benefits] and is designed to meet your specific needs. We have successfully implemented similar solutions for [number] clients with excellent results.', 'This proposal outlines our comprehensive approach to [objective]. Our team brings [X] years of experience and has delivered [achievements]. We are confident in our ability to exceed your expectations.'],
        benefits: ['Cost reduction by 30%\nIncreased efficiency and productivity\nImproved customer satisfaction\nScalable solution for future growth', 'Enhanced data security\nStreamlined operations\n24/7 support and maintenance\nROI within 6 months'],
        nextSteps: ['We propose a meeting next week to discuss the details and answer any questions.\nProject timeline: 3 months\nDelivery in phases with regular milestone reviews', 'Schedule a discovery call\nCustomize solution based on feedback\nProvide detailed timeline and pricing\nBegin implementation upon approval'],
        inquiry: ['We are interested in learning more about your [product/service] offerings. Could you please provide information about pricing, features, and implementation timeline?', 'I am reaching out to inquire about potential partnership opportunities between our organizations. We believe there is strong alignment in our goals and values.'],
        questions: ['What is the pricing structure?\nWhat is the implementation timeline?\nWhat support and training do you provide?\nAre there any case studies available?', 'What are the contract terms?\nWhat customization options are available?\nHow do you handle data security?\nWhat is your customer retention rate?'],
        orderNumber: ['ORD-2025-001', 'INV-12345', 'REF-98765'],
        issue: ['I am writing to formally complain about [issue]. Despite multiple attempts to resolve this matter, the problem persists. The issue occurred on [date] and has caused [impact].', 'I recently received order #[number] and found that [problem]. This is unacceptable and not what I expected based on your product description.'],
        resolution: ['I request a full refund and compensation for the inconvenience caused.', 'I would appreciate a replacement product sent at your earliest convenience.', 'I expect this issue to be resolved within [timeframe] and would like confirmation of the resolution plan.']
    }
};

function suggestContent(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const fieldName = field.dataset.field;
    const button = event.target;
    
    // Show loading state
    button.classList.add('ai-loading');
    button.textContent = '⏳ Generating...';
    
    // Simulate AI processing
    setTimeout(() => {
        const suggestions = aiSuggestions[selectedDocType]?.[fieldName];
        
        if (suggestions && suggestions.length > 0) {
            // Get a random suggestion
            const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            
            // Populate the field
            field.value = suggestion;
            documentData[fieldName] = suggestion;
            
            // Trigger preview update
            updatePreview();
            
            // Show success feedback
            button.textContent = '✓ Generated!';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                button.classList.remove('ai-loading');
                button.textContent = '✨ AI';
                button.style.background = '';
            }, 2000);
            
            showNotification('AI suggestion applied successfully!', 'success');
        } else {
            // No suggestions available
            button.classList.remove('ai-loading');
            button.textContent = '✨ AI';
            showNotification('No suggestions available for this field', 'info');
        }
    }, 800);
}

// New Configuration Handlers
document.addEventListener('DOMContentLoaded', function() {
    initializeConfigHandlers();
});

function initializeConfigHandlers() {
    // Page count slider
    const pageCountSlider = document.getElementById('pageCount');
    const pageCountValue = document.getElementById('pageCountValue');
    if (pageCountSlider && pageCountValue) {
        pageCountSlider.addEventListener('input', function() {
            documentConfig.pageCount = parseInt(this.value);
            pageCountValue.textContent = this.value + ' pages';
        });
    }

    // Font size slider
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', function() {
            documentConfig.fontSize = parseInt(this.value);
            fontSizeValue.textContent = this.value + 'pt';
        });
    }

    // Page size selector
    const pageSize = document.getElementById('pageSize');
    if (pageSize) {
        pageSize.addEventListener('change', function() {
            documentConfig.pageSize = this.value;
        });
    }

    // Content sections checkboxes
    const contentCheckboxes = document.querySelectorAll('input[name="content"]');
    contentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!documentConfig.contentSections.includes(this.value)) {
                    documentConfig.contentSections.push(this.value);
                }
            } else {
                documentConfig.contentSections = documentConfig.contentSections.filter(s => s !== this.value);
            }
        });
    });

    // Analysis type radio buttons
    const analysisRadios = document.querySelectorAll('input[name="analysis"]');
    analysisRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                documentConfig.analysisType = this.value;
            }
        });
    });

    // Text color picker
    const textColor = document.getElementById('textColor');
    const textColorHex = document.getElementById('textColorHex');
    if (textColor && textColorHex) {
        textColor.addEventListener('input', function() {
            documentConfig.textColor = this.value;
            textColorHex.value = this.value;
        });
        textColorHex.addEventListener('input', function() {
            if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                documentConfig.textColor = this.value;
                textColor.value = this.value;
            }
        });
    }

    // Background color picker
    const backgroundColor = document.getElementById('backgroundColor');
    const backgroundColorHex = document.getElementById('backgroundColorHex');
    if (backgroundColor && backgroundColorHex) {
        backgroundColor.addEventListener('input', function() {
            documentConfig.backgroundColor = this.value;
            backgroundColorHex.value = this.value;
        });
        backgroundColorHex.addEventListener('input', function() {
            if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                documentConfig.backgroundColor = this.value;
                backgroundColor.value = this.value;
            }
        });
    }

    // Accent color picker
    const accentColor = document.getElementById('accentColor');
    const accentColorHex = document.getElementById('accentColorHex');
    if (accentColor && accentColorHex) {
        accentColor.addEventListener('input', function() {
            documentConfig.accentColor = this.value;
            accentColorHex.value = this.value;
        });
        accentColorHex.addEventListener('input', function() {
            if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                documentConfig.accentColor = this.value;
                accentColor.value = this.value;
            }
        });
    }

    // Color presets
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.dataset.text;
            const bg = this.dataset.bg;
            const accent = this.dataset.accent;
            
            if (textColor && textColorHex) {
                textColor.value = text;
                textColorHex.value = text;
                documentConfig.textColor = text;
            }
            if (backgroundColor && backgroundColorHex) {
                backgroundColor.value = bg;
                backgroundColorHex.value = bg;
                documentConfig.backgroundColor = bg;
            }
            if (accentColor && accentColorHex) {
                accentColor.value = accent;
                accentColorHex.value = accent;
                documentConfig.accentColor = accent;
            }
            
            showNotification('Color preset applied!', 'success');
        });
    });

    // Font family selector
    const fontFamily = document.getElementById('fontFamily');
    if (fontFamily) {
        fontFamily.addEventListener('change', function() {
            documentConfig.fontFamily = this.value;
        });

        // SEO inputs
        const seoKeywords = document.getElementById('seoKeywords');
        const seoLevel = document.getElementById('seoLevel');
        const generateSeoBtn = document.getElementById('generateSeoBtn');
        if (generateSeoBtn) {
            generateSeoBtn.addEventListener('click', function() {
                    const keywords = seoKeywords ? seoKeywords.value.split(',').map(k => k.trim()).filter(Boolean) : [];
                const level = seoLevel ? seoLevel.value : 'basic';
                documentConfig.seo = { keywords, level };
                generateSeoSuggestions(documentConfig.seo);
            });
        }
    }

    // Line height selector
    const lineHeight = document.getElementById('lineHeight');
    if (lineHeight) {
        lineHeight.addEventListener('change', function() {
            documentConfig.lineHeight = this.value;
        });
    }

    // Preview button
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            openPreview();
        });
    }
}

// Preview Modal Functions
function openPreview() {
    updatePreview();
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function generateFromPreview() {
    closePreview();
    generateDocument();
}

// SEO Suggestion Generator
function generateSeoSuggestions(seoConfig) {
    const modal = document.getElementById('previewModal');
    const preview = document.getElementById('documentPreview');
    if (!seoConfig) return;

    const keywords = seoConfig.keywords || [];
    const level = seoConfig.level || 'basic';

    // If no keywords provided, use the normalized default keywords
    const effectiveKeywords = keywords.length ? keywords : DEFAULT_SEARCH_KEYWORDS.slice(0, 5);

    // Simple heuristics to generate SEO suggestions (no external API required)
    const suggestions = [];
    if (effectiveKeywords.length === 0) {
        suggestions.push('No target keywords provided. Consider adding 3-7 focused keywords.');
    } else {
        suggestions.push(`Primary keywords: ${effectiveKeywords.slice(0,3).join(', ')}`);
        suggestions.push(`Keyword density suggestion: keep primary keywords ~1% across the document`);
    }

    if (level === 'basic') {
        suggestions.push('Add a concise meta description (150-160 chars) summarizing the document.');
        suggestions.push('Include primary keyword in the title and the first paragraph.');
    } else if (level === 'detailed') {
        suggestions.push('Structure content with H1, H2, and H3 headings using keywords naturally.');
        suggestions.push('Add alt text for images and descriptive captions.');
        suggestions.push('Create a summary table of key points and include internal links where relevant.');
    } else if (level === 'audit') {
        suggestions.push('Check page load speed, mobile usability, and fix any broken links.');
        suggestions.push('Validate structured data and Open Graph tags for better sharing.');
    }

    // Attach seoResults to documentConfig for later inclusion
    documentConfig.seoResults = suggestions;

    // Show SEO suggestions in preview area
    const seoHtml = `
        <div class="report-page seo-section">
            <div class="page-header"><h2>SEO Suggestions</h2><span class="page-number">SEO</span></div>
            <div class="content-section">
                <h3>Overview</h3>
                <ul>
                    ${suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        </div>`;

    // Append or replace SEO section in preview
    const existingSeo = preview.querySelector('.seo-section');
    if (existingSeo) {
        existingSeo.remove();
    }
    // Append SEO section at the end of preview
    preview.insertAdjacentHTML('beforeend', seoHtml);

    showNotification('SEO suggestions generated', 'success');
}

// In-app search / suggestions
function setupSearch() {
    const input = document.getElementById('siteSearch');
    const container = document.getElementById('searchSuggestions');
    if (!input || !container) return;

    function clearSuggestions() {
        container.innerHTML = '';
        container.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
    }

    input.addEventListener('input', function() {
        const q = this.value.trim().toLowerCase();
        container.innerHTML = '';
        if (!q) { clearSuggestions(); return; }

        const matches = DEFAULT_SEARCH_KEYWORDS.filter(k => k.includes(q) || q.includes(k) || k.split(' ').some(w => w.startsWith(q)) ).slice(0,6);
        if (matches.length === 0) { clearSuggestions(); return; }

        matches.forEach(m => {
            const item = document.createElement('div');
            item.className = 'search-suggestion-item';
            const map = SEARCH_SUGGESTIONS_MAP[m] || { label: m, href: 'ai-generator.html' };
            item.innerHTML = `<strong>${map.label}</strong><div class="hint">${m}</div>`;
            item.addEventListener('click', () => {
                // navigate to the mapped page
                if (map.href) window.location.href = map.href;
            });
            container.appendChild(item);
        });

        container.style.display = 'block';
        container.setAttribute('aria-hidden', 'false');
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !container.contains(e.target)) {
            clearSuggestions();
        }
    });
}

// Update the existing generateDocument function to use new config
function applyDocumentConfig(doc) {
    // Apply text color
    doc.setTextColor(documentConfig.textColor);
    
    // Apply font
    const fontMap = {
        'Arial, sans-serif': 'helvetica',
        "'Times New Roman', serif": 'times',
        "'Georgia', serif": 'times',
        "'Courier New', monospace": 'courier',
        "'Verdana', sans-serif": 'helvetica',
        "'Trebuchet MS', sans-serif": 'helvetica',
        "'Palatino Linotype', serif": 'times',
        "'Garamond', serif": 'times'
    };
    
    const pdfFont = fontMap[documentConfig.fontFamily] || 'helvetica';
    doc.setFont(pdfFont);
    doc.setFontSize(documentConfig.fontSize);
    
    return doc;
}
