// PDF to PPT Converter - Main JavaScript
// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global state
let slides = [];
let currentSlideIndex = 0;
let pdfDoc = null;
let slideImages = {}; // Store images for each slide

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pdfInput').addEventListener('change', handlePDFUpload);
    document.getElementById('slideTitle').addEventListener('input', updateCurrentSlide);
    document.getElementById('slideContent').addEventListener('input', updateCurrentSlide);
    document.getElementById('slideBgColor').addEventListener('input', function(e) {
        updateCurrentSlide();
        document.getElementById('colorValue').textContent = e.target.value;
    });
    document.getElementById('slideLayout').addEventListener('change', updateCurrentSlide);
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

// Convert PDF pages to slides
async function convertPDFToSlides() {
    slides = [];
    const numPages = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            // Create canvas to render PDF page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert canvas to image
            const imageDataUrl = canvas.toDataURL('image/png');
            
            // Extract text content
            const textContent = await page.getTextContent();
            let text = '';
            textContent.items.forEach(item => {
                text += item.str + ' ';
            });
            
            // Create slide object
            const slide = {
                id: Date.now() + pageNum,
                title: `Slide ${pageNum}`,
                content: text.trim().substring(0, 500) || 'Content from PDF page ' + pageNum,
                bgColor: '#ffffff',
                layout: 'content',
                bgImage: imageDataUrl,
                images: []
            };
            
            slides.push(slide);
            
            // Update progress
            const progress = (pageNum / numPages) * 100;
            document.querySelector('.loading-progress').style.width = progress + '%';
            document.querySelector('.loading-text').textContent = `Processing page ${pageNum} of ${numPages}...`;
        } catch (error) {
            console.error(`Error processing page ${pageNum}:`, error);
        }
    }
    
    renderSlideThumbnails();
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
                ${slide.bgImage ? `<img src="${slide.bgImage}" alt="Slide ${index + 1}">` : ''}
                <div class="thumb-title">${slide.title}</div>
            </div>
        `;
        thumb.innerHTML = thumbContent;
        container.appendChild(thumb);
    });
    
    document.getElementById('slideCount').textContent = slides.length;
}

// Select a slide for editing
function selectSlide(index) {
    if (index < 0 || index >= slides.length) return;
    
    currentSlideIndex = index;
    const slide = slides[index];
    
    // Update form fields
    document.getElementById('slideTitle').value = slide.title;
    document.getElementById('slideContent').value = slide.content;
    document.getElementById('slideBgColor').value = slide.bgColor;
    document.getElementById('colorValue').textContent = slide.bgColor;
    document.getElementById('slideLayout').value = slide.layout;
    
    // Update preview
    renderSlidePreview();
    
    // Update thumbnails
    document.querySelectorAll('.slide-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Update current slide data
function updateCurrentSlide() {
    if (slides.length === 0) return;
    
    const slide = slides[currentSlideIndex];
    slide.title = document.getElementById('slideTitle').value;
    slide.content = document.getElementById('slideContent').value;
    slide.bgColor = document.getElementById('slideBgColor').value;
    slide.layout = document.getElementById('slideLayout').value;
    
    renderSlidePreview();
    renderSlideThumbnails();
}

// Render slide preview
function renderSlidePreview() {
    const canvas = document.getElementById('slideCanvas');
    const slide = slides[currentSlideIndex];
    
    let previewHTML = '';
    
    if (slide.layout === 'title') {
        previewHTML = `
            <div class="slide-layout-title" style="background-color: ${slide.bgColor}">
                ${slide.bgImage ? `<img src="${slide.bgImage}" class="slide-bg-image">` : ''}
                <h1>${slide.title || 'Title'}</h1>
                <p>${slide.content || 'Subtitle'}</p>
            </div>
        `;
    } else if (slide.layout === 'content') {
        previewHTML = `
            <div class="slide-layout-content" style="background-color: ${slide.bgColor}">
                ${slide.bgImage ? `<img src="${slide.bgImage}" class="slide-bg-image">` : ''}
                <h2>${slide.title || 'Title'}</h2>
                <div class="slide-content-text">${slide.content || 'Content'}</div>
                ${renderSlideImages(slide)}
            </div>
        `;
    } else if (slide.layout === 'twoColumn') {
        previewHTML = `
            <div class="slide-layout-two-column" style="background-color: ${slide.bgColor}">
                ${slide.bgImage ? `<img src="${slide.bgImage}" class="slide-bg-image">` : ''}
                <h2>${slide.title || 'Title'}</h2>
                <div class="two-columns">
                    <div class="column">${slide.content || 'Left Column'}</div>
                    <div class="column">${renderSlideImages(slide)}</div>
                </div>
            </div>
        `;
    } else if (slide.layout === 'imageLeft' || slide.layout === 'imageRight') {
        const imageFirst = slide.layout === 'imageLeft';
        previewHTML = `
            <div class="slide-layout-image-text" style="background-color: ${slide.bgColor}">
                ${slide.bgImage ? `<img src="${slide.bgImage}" class="slide-bg-image">` : ''}
                <h2>${slide.title || 'Title'}</h2>
                <div class="image-text-container ${imageFirst ? 'image-left' : 'image-right'}">
                    ${imageFirst ? renderSlideImages(slide) : ''}
                    <div class="text-content">${slide.content || 'Content'}</div>
                    ${!imageFirst ? renderSlideImages(slide) : ''}
                </div>
            </div>
        `;
    }
    
    canvas.innerHTML = previewHTML;
}

// Render images in slide
function renderSlideImages(slide) {
    if (!slide.images || slide.images.length === 0) {
        return '<div class="image-placeholder">No images added</div>';
    }
    
    return slide.images.map(img => 
        `<div class="slide-image-container">
            <img src="${img.url}" alt="${img.alt}" class="slide-image">
            <button class="remove-image-btn" onclick="removeSlideImage(${currentSlideIndex}, '${img.id}')">×</button>
        </div>`
    ).join('');
}

// Add new slide
function addNewSlide() {
    const newSlide = {
        id: Date.now(),
        title: `Slide ${slides.length + 1}`,
        content: 'Enter your content here',
        bgColor: '#ffffff',
        layout: 'content',
        bgImage: null,
        images: []
    };
    
    slides.push(newSlide);
    renderSlideThumbnails();
    selectSlide(slides.length - 1);
    showNotification('New slide added!', 'success');
}

// Delete current slide
function deleteCurrentSlide() {
    if (slides.length === 0) return;
    
    if (confirm('Are you sure you want to delete this slide?')) {
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

// Add image to current slide
function addImageToSlide(imageData) {
    if (slides.length === 0) return;
    
    const slide = slides[currentSlideIndex];
    if (!slide.images) {
        slide.images = [];
    }
    
    // Check if image already added
    if (slide.images.find(img => img.id === imageData.id)) {
        showNotification('Image already added to this slide', 'info');
        return;
    }
    
    slide.images.push(imageData);
    renderSlidePreview();
    renderSlideThumbnails();
    showNotification('Image added to slide!', 'success');
    closeImageSearch();
}

// Remove image from slide
function removeSlideImage(slideIndex, imageId) {
    if (slideIndex < 0 || slideIndex >= slides.length) return;
    
    const slide = slides[slideIndex];
    slide.images = slide.images.filter(img => img.id !== imageId);
    
    renderSlidePreview();
    renderSlideThumbnails();
    showNotification('Image removed', 'info');
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('imageSearchModal');
    if (event.target === modal) {
        closeImageSearch();
    }
}
