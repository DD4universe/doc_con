// PDF to PPT Converter - Main JavaScript
// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global state
let slides = [];
let currentSlideIndex = 0;
let pdfDoc = null;
let extractedElements = []; // All elements from PDF (text blocks and images)
let selectedCard = null;
let cardIdCounter = 0;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let resizeHandle = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pdfInput').addEventListener('change', handlePDFUpload);
    
    // Canvas interactions
    const canvas = document.getElementById('slideCanvas');
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
});

// Handle PDF upload and conversion
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        alert('Please select a valid PDF file');
        return;
    }

    document.getElementById('fileName').textContent = `Selected: ${file.name}`;
    document.getElementById('loadingBar').style.display = 'block';

    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        await convertPDFToSlides();
        
        document.getElementById('loadingBar').style.display = 'none';
        document.getElementById('uploadSection').classList.remove('active');
        document.getElementById('editorSection').classList.add('active');
        
        showNotification('PDF converted successfully! ' + slides.length + ' slides created.', 'success');
    } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Error processing PDF: ' + error.message);
        document.getElementById('loadingBar').style.display = 'none';
    }
}

// Convert PDF pages to slides with extracted elements
async function convertPDFToSlides() {
    slides = [];
    extractedElements = [];
    const numPages = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            // Extract text content with positions
            const textContent = await page.getTextContent();
            const textBlocks = [];
            let currentBlock = { text: '', items: [] };
            
            textContent.items.forEach((item, index) => {
                const transform = item.transform;
                const x = transform[4];
                const y = viewport.height - transform[5]; // Flip Y coordinate
                const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
                
                // Group nearby text items into blocks
                if (currentBlock.items.length === 0) {
                    currentBlock = {
                        text: item.str,
                        items: [{ str: item.str, x, y, fontSize, width: item.width, height: item.height }],
                        x, y, fontSize,
                        width: item.width,
                        height: item.height
                    };
                } else {
                    const lastItem = currentBlock.items[currentBlock.items.length - 1];
                    const distanceY = Math.abs(y - lastItem.y);
                    const distanceX = x - (lastItem.x + lastItem.width);
                    
                    // Same line or close enough
                    if (distanceY < fontSize * 0.5 && distanceX < fontSize * 2) {
                        currentBlock.text += ' ' + item.str;
                        currentBlock.items.push({ str: item.str, x, y, fontSize, width: item.width, height: item.height });
                        currentBlock.width = (x + item.width) - currentBlock.x;
                        currentBlock.height = Math.max(currentBlock.height, item.height);
                    } else {
                        // New block
                        if (currentBlock.text.trim()) {
                            textBlocks.push({ ...currentBlock });
                            extractedElements.push({
                                id: `elem_${Date.now()}_${extractedElements.length}`,
                                type: 'text',
                                content: currentBlock.text.trim(),
                                page: pageNum,
                                x: currentBlock.x,
                                y: currentBlock.y,
                                width: currentBlock.width,
                                height: currentBlock.height,
                                fontSize: currentBlock.fontSize
                            });
                        }
                        currentBlock = {
                            text: item.str,
                            items: [{ str: item.str, x, y, fontSize, width: item.width, height: item.height }],
                            x, y, fontSize,
                            width: item.width,
                            height: item.height
                        };
                    }
                }
            });
            
            // Add last block
            if (currentBlock.text.trim()) {
                textBlocks.push(currentBlock);
                extractedElements.push({
                    id: `elem_${Date.now()}_${extractedElements.length}`,
                    type: 'text',
                    content: currentBlock.text.trim(),
                    page: pageNum,
                    x: currentBlock.x,
                    y: currentBlock.y,
                    width: currentBlock.width,
                    height: currentBlock.height,
                    fontSize: currentBlock.fontSize
                });
            }
            
            // Extract images from PDF page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Try to extract embedded images
            const ops = await page.getOperatorList();
            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                    try {
                        const imgData = canvas.toDataURL('image/png');
                        extractedElements.push({
                            id: `elem_${Date.now()}_${extractedElements.length}`,
                            type: 'image',
                            src: imgData,
                            page: pageNum,
                            x: 50,
                            y: 50,
                            width: 200,
                            height: 150
                        });
                    } catch (e) {
                        console.warn('Could not extract image', e);
                    }
                }
            }
            
            // Create slide with cards from this page
            const slide = {
                id: Date.now() + pageNum,
                bgColor: '#ffffff',
                cards: []
            };
            
            slides.push(slide);
            
            // Update progress
            const progress = (pageNum / numPages) * 100;
            document.querySelector('.loading-progress').style.width = progress + '%';
            document.querySelector('.loading-text').textContent = `Extracting page ${pageNum} of ${numPages}...`;
        } catch (error) {
            console.error(`Error processing page ${pageNum}:`, error);
        }
    }
    
    renderSlideThumbnails();
    renderElementLibrary();
    if (slides.length > 0) {
        selectSlide(0);
    }
}

// Render slide thumbnails
function renderSlideThumbnails() {
    const container = document.getElementById('slideThumbnails');
    container.innerHTML = '';
    
    slides.forEach((slide, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'slide-thumb' + (index === currentSlideIndex ? ' active' : '');
        thumb.onclick = () => selectSlide(index);
        
        const thumbContent = `
            <div class="thumb-number">${index + 1}</div>
            <div class="thumb-preview" style="background-color: ${slide.bgColor}">
                <div class="thumb-cards">${slide.cards ? slide.cards.length : 0} elements</div>
            </div>
        `;
        thumb.innerHTML = thumbContent;
        container.appendChild(thumb);
    });
    
    document.getElementById('slideCount').textContent = slides.length;
}

// Render element library
function renderElementLibrary() {
    const content = document.getElementById('libraryContent');
    
    if (extractedElements.length === 0) {
        content.innerHTML = '<div class="empty-library">No elements extracted yet. Upload a PDF to get started.</div>';
        return;
    }
    
    content.innerHTML = '';
    
    extractedElements.forEach(element => {
        const card = document.createElement('div');
        card.className = 'library-card';
        card.draggable = true;
        card.ondragstart = (e) => handleLibraryDragStart(e, element);
        
        if (element.type === 'text') {
            card.innerHTML = `
                <div class="library-card-icon">📝</div>
                <div class="library-card-content">
                    <div class="library-card-text">${element.content.substring(0, 50)}${element.content.length > 50 ? '...' : ''}</div>
                    <div class="library-card-info">Page ${element.page} • Text</div>
                </div>
                <button class="library-card-add" onclick="addElementToSlide('${element.id}')">+</button>
            `;
        } else if (element.type === 'image') {
            card.innerHTML = `
                <div class="library-card-image">
                    <img src="${element.src}" alt="Image">
                </div>
                <div class="library-card-info">Page ${element.page} • Image</div>
                <button class="library-card-add" onclick="addElementToSlide('${element.id}')">+</button>
            `;
        }
        
        content.appendChild(card);
    });
}

// Select a slide for editing
function selectSlide(index) {
    if (index < 0 || index >= slides.length) return;
    
    currentSlideIndex = index;
    const slide = slides[index];
    
    // Update background color selector
    document.getElementById('slideBgColor').value = slide.bgColor || '#ffffff';
    
    // Render slide canvas
    renderSlideCanvas();
    
    // Update thumbnails
    document.querySelectorAll('.slide-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    
    deselectAllCards();
}

// Render slide canvas with cards
function renderSlideCanvas() {
    const canvas = document.getElementById('slideCanvas');
    const slide = slides[currentSlideIndex];
    
    if (!slide) {
        canvas.innerHTML = '<div class="no-slide">No slide selected</div>';
        return;
    }
    
    canvas.style.backgroundColor = slide.bgColor || '#ffffff';
    canvas.innerHTML = '';
    
    if (!slide.cards || slide.cards.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'canvas-hint';
        hint.textContent = '📚 Drag elements from the library or use toolbar buttons to add content';
        canvas.appendChild(hint);
        return;
    }
    
    // Render all cards
    slide.cards.forEach(card => {
        renderCard(card);
    });
}

// Render individual card on canvas
function renderCard(card) {
    const canvas = document.getElementById('slideCanvas');
    const cardEl = document.createElement('div');
    cardEl.className = 'slide-card' + (card.selected ? ' selected' : '');
    cardEl.id = `card_${card.id}`;
    cardEl.style.left = card.x + 'px';
    cardEl.style.top = card.y + 'px';
    cardEl.style.width = card.width + 'px';
    cardEl.style.height = card.height + 'px';
    cardEl.style.zIndex = card.zIndex || 1;
    
    if (card.type === 'text') {
        cardEl.innerHTML = `
            <div class="card-content text-card" contenteditable="true" 
                 style="font-size: ${card.fontSize || 16}px; color: ${card.color || '#333'}; text-align: ${card.align || 'left'};"
                 oninput="updateCardContent('${card.id}', this.innerText)">
                ${card.content}
            </div>
            <div class="card-toolbar">
                <input type="color" value="${card.color || '#333333'}" onchange="updateCardColor('${card.id}', this.value)" title="Text Color">
                <select onchange="updateCardFontSize('${card.id}', this.value)" title="Font Size">
                    <option value="12" ${card.fontSize === 12 ? 'selected' : ''}>12px</option>
                    <option value="14" ${card.fontSize === 14 ? 'selected' : ''}>14px</option>
                    <option value="16" ${card.fontSize === 16 ? 'selected' : ''}>16px</option>
                    <option value="18" ${card.fontSize === 18 ? 'selected' : ''}>18px</option>
                    <option value="24" ${card.fontSize === 24 ? 'selected' : ''}>24px</option>
                    <option value="32" ${card.fontSize === 32 ? 'selected' : ''}>32px</option>
                </select>
                <select onchange="updateCardAlign('${card.id}', this.value)" title="Alignment">
                    <option value="left" ${card.align === 'left' ? 'selected' : ''}>⬅️</option>
                    <option value="center" ${card.align === 'center' ? 'selected' : ''}>↔️</option>
                    <option value="right" ${card.align === 'right' ? 'selected' : ''}>➡️</option>
                </select>
                <button onclick="checkCardGrammar('${card.id}')" title="Check Grammar">✓</button>
                <button onclick="deleteCard('${card.id}')" title="Delete">🗑️</button>
            </div>
            <div class="resize-handle resize-se"></div>
        `;
    } else if (card.type === 'image') {
        cardEl.innerHTML = `
            <img src="${card.src}" class="card-image" style="width: 100%; height: 100%; object-fit: ${card.fit || 'contain'};">
            <div class="card-toolbar">
                <select onchange="updateCardFit('${card.id}', this.value)" title="Image Fit">
                    <option value="contain" ${card.fit === 'contain' ? 'selected' : ''}>Contain</option>
                    <option value="cover" ${card.fit === 'cover' ? 'selected' : ''}>Cover</option>
                    <option value="fill" ${card.fit === 'fill' ? 'selected' : ''}>Fill</option>
                </select>
                <button onclick="cropCard('${card.id}')" title="Crop">✂️</button>
                <button onclick="deleteCard('${card.id}')" title="Delete">🗑️</button>
            </div>
            <div class="resize-handle resize-se"></div>
        `;
    }
    
    canvas.appendChild(cardEl);
}

// Card manipulation functions
function addElementToSlide(elementId) {
    const element = extractedElements.find(e => e.id === elementId);
    if (!element || slides.length === 0) return;
    
    const slide = slides[currentSlideIndex];
    if (!slide.cards) slide.cards = [];
    
    const card = {
        id: cardIdCounter++,
        type: element.type,
        x: 50 + (slide.cards.length * 20),
        y: 50 + (slide.cards.length * 20),
        width: element.type === 'text' ? 400 : 300,
        height: element.type === 'text' ? 100 : 200,
        zIndex: slide.cards.length + 1
    };
    
    if (element.type === 'text') {
        card.content = element.content;
        card.fontSize = Math.min(Math.max(element.fontSize || 16, 12), 32);
        card.color = '#333333';
        card.align = 'left';
    } else if (element.type === 'image') {
        card.src = element.src;
        card.fit = 'contain';
    }
    
    slide.cards.push(card);
    renderSlideCanvas();
    renderSlideThumbnails();
    showNotification('Element added to slide!', 'success');
}

// Image Search Functions
function openImageSearch() {
    if (slides.length === 0) {
        showNotification('Create a slide first', 'info');
        return;
    }
    document.getElementById('imageSearchModal').style.display = 'flex';
}

function closeImageSearch() {
    document.getElementById('imageSearchModal').style.display = 'none';
}

// Image Search Functions
function openImageSearch() {
    if (slides.length === 0) {
        alert('Please add a slide first');
        return;
    }
    document.getElementById('imageSearchModal').style.display = 'flex';
}

function closeImageSearch() {
    document.getElementById('imageSearchModal').style.display = 'none';
}

// Search images using Unsplash API (free tier)
async function searchImages() {
    const query = document.getElementById('imageSearchInput').value.trim();
    if (!query) {
        alert('Please enter search keywords');
        return;
    }
    
    const resultsContainer = document.getElementById('imageResults');
    resultsContainer.innerHTML = '<div class="loading">Searching images...</div>';
    
    try {
        // Using Unsplash API (requires API key - using demo mode with limited results)
        // For production, replace with your Unsplash API key
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&client_id=demo`);
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displayImageResults(data.results);
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No images found. Try different keywords.</div>';
        }
    } catch (error) {
        console.error('Image search error:', error);
        // Fallback to demo images if API fails
        displayDemoImages(query);
    }
}

// Display image search results
function displayImageResults(images) {
    const resultsContainer = document.getElementById('imageResults');
    resultsContainer.innerHTML = '';
    
    images.forEach(img => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        imageCard.innerHTML = `
            <img src="${img.urls.small}" alt="${img.alt_description || img.description || 'Image'}">
            <button class="btn-add-image" onclick='addImageToSlide(${JSON.stringify({
                id: img.id,
                url: img.urls.regular,
                thumb: img.urls.small,
                alt: img.alt_description || img.description || 'Image'
            })})'>Add to Slide</button>
        `;
        resultsContainer.appendChild(imageCard);
    });
}

// Fallback demo images
function displayDemoImages(query) {
    const resultsContainer = document.getElementById('imageResults');
    resultsContainer.innerHTML = '<div class="info-message">📌 Using demo images. Add your Unsplash API key for real searches.</div>';
    
    // Demo images from placeholder services
    const demoImages = [];
    for (let i = 1; i <= 12; i++) {
        demoImages.push({
            id: `demo-${i}`,
            url: `https://picsum.photos/800/600?random=${i}&q=${query}`,
            thumb: `https://picsum.photos/200/150?random=${i}&q=${query}`,
            alt: `${query} image ${i}`
        });
    }
    
    demoImages.forEach(img => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        imageCard.innerHTML = `
            <img src="${img.thumb}" alt="${img.alt}">
            <button class="btn-add-image" onclick='addImageToSlide(${JSON.stringify(img)})'>Add to Slide</button>
        `;
        resultsContainer.appendChild(imageCard);
    });
}

// Add image to current slide as card
function addImageToSlide(imageData) {
    if (slides.length === 0) return;
    
    const slide = slides[currentSlideIndex];
    if (!slide.cards) slide.cards = [];
    
    const card = {
        id: cardIdCounter++,
        type: 'image',
        src: imageData.url,
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        fit: 'contain',
        zIndex: slide.cards.length + 1
    };
    
    slide.cards.push(card);
    renderSlideCanvas();
    renderSlideThumbnails();
    showNotification('Image added to slide!', 'success');
    closeImageSearch();
}

// Generate PowerPoint file
async function generatePPT() {
    if (slides.length === 0) {
        alert('No slides to export. Please add some slides first.');
        return;
    }
    
    showNotification('Generating PowerPoint presentation...', 'info');
    
    try {
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.author = 'Doc Converter';
        pptx.title = 'Generated Presentation';
        pptx.subject = 'PDF to PPT Conversion';
        
        // Add each slide
        for (let i = 0; i < slides.length; i++) {
            const slideData = slides[i];
            const slide = pptx.addSlide();
            
            // Set background color
            slide.background = { color: slideData.bgColor.replace('#', '') };
            
            // Add background image if exists (as watermark)
            if (slideData.bgImage) {
                try {
                    slide.addImage({
                        data: slideData.bgImage,
                        x: 0,
                        y: 0,
                        w: '100%',
                        h: '100%',
                        transparency: 30
                    });
                } catch (e) {
                    console.warn('Could not add background image to slide', i + 1);
                }
            }
            
            // Add content based on layout
            if (slideData.layout === 'title') {
                slide.addText(slideData.title, {
                    x: 1,
                    y: 2,
                    w: 8,
                    h: 1.5,
                    fontSize: 44,
                    bold: true,
                    align: 'center',
                    color: '363636'
                });
                
                slide.addText(slideData.content, {
                    x: 1,
                    y: 3.5,
                    w: 8,
                    h: 1,
                    fontSize: 24,
                    align: 'center',
                    color: '666666'
                });
            } else if (slideData.layout === 'content') {
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.5,
                    w: 9,
                    h: 0.75,
                    fontSize: 32,
                    bold: true,
                    color: '363636'
                });
                
                slide.addText(slideData.content, {
                    x: 0.5,
                    y: 1.5,
                    w: 9,
                    h: 3,
                    fontSize: 18,
                    color: '666666',
                    valign: 'top'
                });
                
                // Add images
                if (slideData.images && slideData.images.length > 0) {
                    const img = slideData.images[0];
                    slide.addImage({
                        data: img.url,
                        x: 6,
                        y: 4.5,
                        w: 3,
                        h: 2
                    });
                }
            } else if (slideData.layout === 'twoColumn') {
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.5,
                    w: 9,
                    h: 0.75,
                    fontSize: 32,
                    bold: true,
                    color: '363636'
                });
                
                slide.addText(slideData.content, {
                    x: 0.5,
                    y: 1.5,
                    w: 4.25,
                    h: 4,
                    fontSize: 18,
                    color: '666666',
                    valign: 'top'
                });
                
                if (slideData.images && slideData.images.length > 0) {
                    const img = slideData.images[0];
                    slide.addImage({
                        data: img.url,
                        x: 5.25,
                        y: 1.5,
                        w: 4.25,
                        h: 4
                    });
                }
            } else if (slideData.layout === 'imageLeft' || slideData.layout === 'imageRight') {
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.5,
                    w: 9,
                    h: 0.75,
                    fontSize: 32,
                    bold: true,
                    color: '363636'
                });
                
                const imageOnLeft = slideData.layout === 'imageLeft';
                
                if (slideData.images && slideData.images.length > 0) {
                    const img = slideData.images[0];
                    slide.addImage({
                        data: img.url,
                        x: imageOnLeft ? 0.5 : 5.5,
                        y: 1.5,
                        w: 4,
                        h: 4
                    });
                }
                
                slide.addText(slideData.content, {
                    x: imageOnLeft ? 5 : 0.5,
                    y: 1.5,
                    w: 4.5,
                    h: 4,
                    fontSize: 18,
                    color: '666666',
                    valign: 'top'
                });
            }
        }
        
        // Save presentation
        const fileName = `presentation_${new Date().getTime()}.pptx`;
        await pptx.writeFile({ fileName });
        
        showNotification('PowerPoint presentation downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating PPT:', error);
        alert('Error generating PowerPoint: ' + error.message);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Grammar Checking (using basic built-in checks + LanguageTool API)
async function checkGrammar(fieldId) {
    const field = document.getElementById(fieldId);
    const text = field.value.trim();
    
    if (!text) {
        showNotification('Please enter some text to check', 'info');
        return;
    }
    
    showNotification('Checking grammar...', 'info');
    
    try {
        // Use LanguageTool API (free tier)
        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `text=${encodeURIComponent(text)}&language=en-US`
        });
        
        const data = await response.json();
        
        if (data.matches && data.matches.length > 0) {
            // Show grammar suggestions
            let suggestions = '📝 Grammar Suggestions:\n\n';
            data.matches.slice(0, 5).forEach((match, i) => {
                suggestions += `${i + 1}. ${match.message}\n`;
                if (match.replacements && match.replacements.length > 0) {
                    suggestions += `   Suggestion: ${match.replacements[0].value}\n\n`;
                }
            });
            
            if (confirm(suggestions + '\nWould you like to apply the first suggestion?')) {
                const firstMatch = data.matches[0];
                if (firstMatch.replacements && firstMatch.replacements.length > 0) {
                    const corrected = text.substring(0, firstMatch.offset) + 
                                    firstMatch.replacements[0].value + 
                                    text.substring(firstMatch.offset + firstMatch.length);
                    field.value = corrected;
                    updateCurrentSlide();
                    showNotification('Grammar correction applied!', 'success');
                }
            }
        } else {
            showNotification('✓ No grammar issues found!', 'success');
        }
    } catch (error) {
        console.error('Grammar check error:', error);
        // Fallback to basic checks
        performBasicGrammarCheck(text, field);
    }
}

// Basic grammar checks
function performBasicGrammarCheck(text, field) {
    const issues = [];
    
    // Check for double spaces
    if (text.includes('  ')) {
        issues.push('Multiple consecutive spaces found');
    }
    
    // Check for missing capitalization at start
    if (text.length > 0 && text[0] !== text[0].toUpperCase()) {
        issues.push('Text should start with capital letter');
    }
    
    // Check for missing punctuation at end
    const lastChar = text[text.length - 1];
    if (text.length > 0 && !['.', '!', '?', ':', ';'].includes(lastChar)) {
        issues.push('Consider adding punctuation at the end');
    }
    
    if (issues.length > 0) {
        showNotification('Grammar suggestions: ' + issues.join('; '), 'info');
    } else {
        showNotification('✓ Basic checks passed!', 'success');
    }
}

// Drag Mode
function toggleDragMode() {
    dragModeEnabled = document.getElementById('dragMode').checked;
    
    if (dragModeEnabled) {
        enableDragging();
        showNotification('Drag mode enabled! Click and drag elements to reposition', 'info');
    } else {
        disableDragging();
        showNotification('Drag mode disabled', 'info');
    }
}

function enableDragging() {
    const elements = document.querySelectorAll('.draggable-element');
    
    elements.forEach(element => {
        element.style.cursor = 'move';
        element.style.position = 'relative';
        element.classList.add('draggable-active');
        
        element.addEventListener('mousedown', startDrag);
    });
}

function disableDragging() {
    const elements = document.querySelectorAll('.draggable-element');
    
    elements.forEach(element => {
        element.style.cursor = 'default';
        element.classList.remove('draggable-active');
        element.removeEventListener('mousedown', startDrag);
    });
}

let draggedElement = null;
let startX, startY, startLeft, startTop;

function startDrag(e) {
    if (!dragModeEnabled) return;
    
    draggedElement = e.target.closest('.draggable-element');
    if (!draggedElement) return;
    
    e.preventDefault();
    
    const rect = draggedElement.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    
    const currentLeft = parseFloat(draggedElement.style.left || '0');
    const currentTop = parseFloat(draggedElement.style.top || '0');
    
    startLeft = currentLeft;
    startTop = currentTop;
    
    draggedElement.classList.add('dragging');
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
}

function doDrag(e) {
    if (!draggedElement) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    draggedElement.style.left = (startLeft + deltaX) + 'px';
    draggedElement.style.top = (startTop + deltaY) + 'px';
}

function stopDrag() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        
        // Save position
        const slide = slides[currentSlideIndex];
        const elementType = draggedElement.getAttribute('data-type');
        if (!slide.elementPositions) {
            slide.elementPositions = {};
        }
        slide.elementPositions[elementType] = {
            left: draggedElement.style.left,
            top: draggedElement.style.top
        };
        
        draggedElement = null;
    }
    
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// Grouping
function toggleGroupMode() {
    const btn = document.getElementById('groupBtn');
    
    if (selectedElements.length === 0) {
        // Select mode
        btn.textContent = '✓ Select';
        btn.style.background = '#28a745';
        enableElementSelection();
        showNotification('Click elements to select for grouping', 'info');
    } else if (selectedElements.length > 1) {
        // Group elements
        groupElements();
        btn.textContent = '🔗 Group';
        btn.style.background = '';
        disableElementSelection();
    } else {
        // Cancel
        selectedElements = [];
        btn.textContent = '🔗 Group';
        btn.style.background = '';
        disableElementSelection();
        showNotification('Selection cancelled', 'info');
    }
}

function enableElementSelection() {
    const elements = document.querySelectorAll('.draggable-element');
    
    elements.forEach(element => {
        element.addEventListener('click', selectElement);
        element.style.cursor = 'pointer';
    });
}

function disableElementSelection() {
    const elements = document.querySelectorAll('.draggable-element');
    
    elements.forEach(element => {
        element.removeEventListener('click', selectElement);
        element.classList.remove('selected');
        element.style.cursor = dragModeEnabled ? 'move' : 'default';
    });
    
    selectedElements = [];
}

function selectElement(e) {
    e.stopPropagation();
    const element = e.target.closest('.draggable-element');
    
    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        selectedElements = selectedElements.filter(el => el !== element);
    } else {
        element.classList.add('selected');
        selectedElements.push(element);
    }
    
    showNotification(`${selectedElements.length} element(s) selected`, 'info');
}

function groupElements() {
    if (selectedElements.length < 2) {
        showNotification('Select at least 2 elements to group', 'info');
        return;
    }
    
    const groupId = Date.now();
    selectedElements.forEach(element => {
        element.setAttribute('data-group', groupId);
        element.classList.remove('selected');
    });
    
    groupedElements.push({
        id: groupId,
        elements: [...selectedElements]
    });
    
    showNotification(`${selectedElements.length} elements grouped!`, 'success');
    selectedElements = [];
}

// Layer Control
function bringToFront() {
    const elements = document.querySelectorAll('.draggable-element.selected');
    
    if (elements.length === 0) {
        showNotification('Select an element first (enable Group mode and click element)', 'info');
        return;
    }
    
    elements.forEach(element => {
        element.style.zIndex = '100';
    });
    
    showNotification('Element(s) brought to front', 'success');
}

function sendToBack() {
    const elements = document.querySelectorAll('.draggable-element.selected');
    
    if (elements.length === 0) {
        showNotification('Select an element first (enable Group mode and click element)', 'info');
        return;
    }
    
    elements.forEach(element => {
        element.style.zIndex = '1';
    });
    
    showNotification('Element(s) sent to back', 'success');
}

// Card update functions
function updateCardContent(cardId, content) {
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == cardId);
    if (card) {
        card.content = content;
    }
}

function updateCardColor(cardId, color) {
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == cardId);
    if (card) {
        card.color = color;
        renderSlideCanvas();
    }
}

function updateCardFontSize(cardId, fontSize) {
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == cardId);
    if (card) {
        card.fontSize = parseInt(fontSize);
        renderSlideCanvas();
    }
}

function updateCardAlign(cardId, align) {
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == cardId);
    if (card) {
        card.align = align;
        renderSlideCanvas();
    }
}

function updateCardFit(cardId, fit) {
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == cardId);
    if (card) {
        card.fit = fit;
        renderSlideCanvas();
    }
}

async function checkCardGrammar(cardId) {
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == cardId);
    if (!card || !card.content) return;
    
    await checkGrammar(card.content, (corrected) => {
        card.content = corrected;
        renderSlideCanvas();
    });
}

function deleteCard(cardId) {
    const slide = slides[currentSlideIndex];
    slide.cards = slide.cards.filter(c => c.id != cardId);
    renderSlideCanvas();
    renderSlideThumbnails();
    showNotification('Card deleted', 'info');
}

function cropCard(cardId) {
    showNotification('Crop feature - use resize handles to adjust size', 'info');
}

// Mouse event handlers
function handleCanvasMouseDown(e) {
    const target = e.target;
    
    // Check if clicking on card
    const card = target.closest('.slide-card');
    if (card && !target.closest('.card-toolbar') && !target.classList.contains('card-content')) {
        e.stopPropagation();
        selectCard(card.id.replace('card_', ''));
        
        // Check if on resize handle
        if (target.classList.contains('resize-handle')) {
            isResizing = true;
            resizeHandle = target;
        } else {
            isDragging = true;
            const rect = card.getBoundingClientRect();
            const canvasRect = document.getElementById('slideCanvas').getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left + canvasRect.left;
            dragOffset.y = e.clientY - rect.top + canvasRect.top;
        }
    }
}

function handleMouseMove(e) {
    if (!selectedCard) return;
    
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == selectedCard);
    if (!card) return;
    
    const canvasRect = document.getElementById('slideCanvas').getBoundingClientRect();
    
    if (isDragging) {
        card.x = Math.max(0, Math.min(e.clientX - canvasRect.left - dragOffset.x, canvasRect.width - card.width));
        card.y = Math.max(0, Math.min(e.clientY - canvasRect.top - dragOffset.y, canvasRect.height - card.height));
        
        const cardEl = document.getElementById(`card_${card.id}`);
        if (cardEl) {
            cardEl.style.left = card.x + 'px';
            cardEl.style.top = card.y + 'px';
        }
    } else if (isResizing) {
        const newWidth = Math.max(100, e.clientX - canvasRect.left - card.x);
        const newHeight = Math.max(50, e.clientY - canvasRect.top - card.y);
        
        card.width = newWidth;
        card.height = newHeight;
        
        const cardEl = document.getElementById(`card_${card.id}`);
        if (cardEl) {
            cardEl.style.width = card.width + 'px';
            cardEl.style.height = card.height + 'px';
        }
    }
}

function handleMouseUp() {
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
}

function selectCard(cardId) {
    deselectAllCards();
    selectedCard = parseInt(cardId);
    
    const slide = slides[currentSlideIndex];
    const card = slide.cards.find(c => c.id == selectedCard);
    if (card) {
        card.selected = true;
        const cardEl = document.getElementById(`card_${card.id}`);
        if (cardEl) cardEl.classList.add('selected');
    }
}

function deselectAllCards() {
    selectedCard = null;
    const slide = slides[currentSlideIndex];
    if (slide && slide.cards) {
        slide.cards.forEach(c => c.selected = false);
    }
    document.querySelectorAll('.slide-card').forEach(el => el.classList.remove('selected'));
}

function deleteSelectedCard() {
    if (selectedCard !== null) {
        deleteCard(selectedCard);
        selectedCard = null;
    } else {
        showNotification('Select a card first', 'info');
    }
}

// Keyboard shortcuts
function handleKeyDown(e) {
    if (e.key === 'Delete' && selectedCard !== null) {
        deleteCard(selectedCard);
    } else if (e.key === 'Escape') {
        deselectAllCards();
    }
}

// UI functions
function addTextCard() {
    if (slides.length === 0) {
        showNotification('Create a slide first', 'info');
        return;
    }
    
    const slide = slides[currentSlideIndex];
    if (!slide.cards) slide.cards = [];
    
    const card = {
        id: cardIdCounter++,
        type: 'text',
        content: 'Enter your text here',
        x: 100,
        y: 100,
        width: 400,
        height: 100,
        fontSize: 16,
        color: '#333333',
        align: 'left',
        zIndex: slide.cards.length + 1
    };
    
    slide.cards.push(card);
    renderSlideCanvas();
    renderSlideThumbnails();
    showNotification('Text card added!', 'success');
}

function updateSlideBackground() {
    if (slides.length === 0) return;
    const slide = slides[currentSlideIndex];
    slide.bgColor = document.getElementById('slideBgColor').value;
    renderSlideCanvas();
    renderSlideThumbnails();
}

function openElementLibrary() {
    document.getElementById('elementLibrary').classList.add('open');
}

function closeElementLibrary() {
    document.getElementById('elementLibrary').classList.remove('open');
}

function switchLibraryTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter elements by tab
    const cards = document.querySelectorAll('.library-card');
    cards.forEach(card => {
        if (tab === 'all') {
            card.style.display = 'flex';
        } else if (tab === 'text') {
            card.style.display = card.querySelector('.library-card-icon') ? 'flex' : 'none';
        } else if (tab === 'images') {
            card.style.display = card.querySelector('.library-card-image') ? 'flex' : 'none';
        }
    });
}

function handleLibraryDragStart(e, element) {
    e.dataTransfer.setData('elementId', element.id);
}

// Add new slide
function addNewSlide() {
    const newSlide = {
        id: Date.now(),
        bgColor: '#ffffff',
        cards: []
    };
    
    slides.push(newSlide);
    renderSlideThumbnails();
    selectSlide(slides.length - 1);
    showNotification('New slide added!', 'success');
}

// Delete current slide
function deleteCurrentSlide() {
    if (slides.length === 0) return;
    
    if (confirm('Delete this slide?')) {
        slides.splice(currentSlideIndex, 1);
        
        if (slides.length === 0) {
            document.getElementById('slideCanvas').innerHTML = '<div class="no-slide">No slides. Add a new slide to start.</div>';
            currentSlideIndex = 0;
        } else {
            currentSlideIndex = Math.min(currentSlideIndex, slides.length - 1);
            selectSlide(currentSlideIndex);
        }
        
        renderSlideThumbnails();
        showNotification('Slide deleted', 'info');
    }
}

// Grammar check with callback
async function checkGrammar(text, callback) {
    if (!text.trim()) return;
    
    try {
        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `text=${encodeURIComponent(text)}&language=en-US`
        });
        
        const data = await response.json();
        
        if (data.matches && data.matches.length > 0) {
            const firstMatch = data.matches[0];
            if (firstMatch.replacements && firstMatch.replacements.length > 0) {
                if (confirm(`Grammar issue: ${firstMatch.message}\n\nApply suggestion: "${firstMatch.replacements[0].value}"?`)) {
                    const corrected = text.substring(0, firstMatch.offset) + 
                                    firstMatch.replacements[0].value + 
                                    text.substring(firstMatch.offset + firstMatch.length);
                    callback(corrected);
                    showNotification('Grammar corrected!', 'success');
                }
            }
        } else {
            showNotification('No grammar issues found!', 'success');
        }
    } catch (error) {
        showNotification('Grammar check unavailable', 'info');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('imageSearchModal');
    if (event.target === modal) {
        closeImageSearch();
    }
}
