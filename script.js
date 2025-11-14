// Character counter
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const convertBtn = document.getElementById('convertBtn');

textInput.addEventListener('input', () => {
    const count = textInput.value.length;
    charCount.textContent = count.toLocaleString();
    
    // Update button state
    if (count > 0) {
        convertBtn.disabled = false;
    } else {
        convertBtn.disabled = true;
    }
});

// Initialize button state
convertBtn.disabled = true;

// Format selection
const formatOptions = document.querySelectorAll('input[name="format"]');

// Convert and download function
convertBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    
    if (!text) {
        alert('Please enter some text to convert!');
        return;
    }
    
    const selectedFormat = document.querySelector('input[name="format"]:checked').value;
    
    // Add loading state
    convertBtn.classList.add('loading');
    convertBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="60" stroke-dashoffset="40" opacity="0.3"/><path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" stroke-width="4"/></svg> Converting...';
    
    try {
        switch (selectedFormat) {
            case 'pdf':
                await downloadAsPDF(text);
                break;
            case 'docx':
                await downloadAsDOCX(text);
                break;
            case 'txt':
                downloadAsTXT(text);
                break;
            case 'rtf':
                downloadAsRTF(text);
                break;
            case 'html':
                downloadAsHTML(text);
                break;
            case 'markdown':
                downloadAsMarkdown(text);
                break;
        }
        
        // Show success message
        showNotification('Document downloaded successfully!', 'success');
    } catch (error) {
        console.error('Conversion error:', error);
        showNotification('An error occurred during conversion. Please try again.', 'error');
    } finally {
        // Reset button state
        setTimeout(() => {
            convertBtn.classList.remove('loading');
            convertBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Convert & Download';
        }, 1000);
    }
});

// PDF Download
async function downloadAsPDF(text) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
        title: 'DURAI Document',
        subject: 'Converted Document',
        author: 'DURAI Document Converter',
        creator: 'DURAI'
    });
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('DURAI Document', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);
    
    // Add content
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, 40);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Created with DURAI Document Converter', 105, 290, { align: 'center' });
    }
    
    doc.save('DURAI-document.pdf');
}

// DOCX Download (simplified version)
async function downloadAsDOCX(text) {
    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>DURAI Document</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
                h1 { color: #2563eb; }
                .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>DURAI Document</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
                ${text.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
                <p>Created with DURAI Document Converter</p>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob(['\ufeff', content], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DURAI-document.doc';
    link.click();
    URL.revokeObjectURL(url);
}

// TXT Download
function downloadAsTXT(text) {
    const content = `DURAI DOCUMENT CONVERTER
Generated on ${new Date().toLocaleDateString()}
${'='.repeat(50)}

${text}

${'='.repeat(50)}
Created with DURAI Document Converter`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DURAI-document.txt';
    link.click();
    URL.revokeObjectURL(url);
}

// RTF Download
function downloadAsRTF(text) {
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
{\\colortbl;\\red37\\green99\\blue235;\\red30\\green41\\blue59;}
\\f0\\fs24
{\\cf1\\b\\fs32 DURAI Document\\par}
\\cf2\\fs20 Generated on ${new Date().toLocaleDateString()}\\par
\\par
${text.replace(/\n/g, '\\par\n')}
\\par
\\par
{\\fs18 Created with DURAI Document Converter}
}`;
    
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DURAI-document.rtf';
    link.click();
    URL.revokeObjectURL(url);
}

// HTML Download
function downloadAsHTML(text) {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DURAI Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #1e293b;
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
        }
        .date {
            color: #64748b;
            font-size: 14px;
        }
        .content {
            white-space: pre-wrap;
            margin-bottom: 40px;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DURAI Document</h1>
        <p class="date">Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="content">${text}</div>
    <div class="footer">
        <p>Created with DURAI Document Converter</p>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DURAI-document.html';
    link.click();
    URL.revokeObjectURL(url);
}

// Markdown Download
function downloadAsMarkdown(text) {
    const mdContent = `# DURAI Document

**Generated on ${new Date().toLocaleDateString()}**

---

${text}

---

*Created with DURAI Document Converter*`;
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DURAI-document.md';
    link.click();
    URL.revokeObjectURL(url);
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
