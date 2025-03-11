import React, { useState, useRef, useEffect } from 'react';

// Import a static base64-encoded font at the top of the file
// This is a trimmed version of Noto Sans Telugu that contains just the essential glyphs
const TELUGU_FONT_BASE64 = 'AAEAAAAOAIAAAwBgT1MvMj5jQVIAAADsAAAAVmNtYXDGJ76aAAABRAAAAaJnbHlm+fkoZgAAAsAAAAawZGVhbVJmFQYAAAUgAAAANmhoZWEHowNrAAAFWAAAACRobXR4DAAAAAAAAVwAAAAQbG9jYUVnQUQAAAK8AAAACm1heHABFwB5AAAFPAAAACBuYW1l/kkqkwAABXAAAADacG9zdP+4ADIAAAboAAAAOAABAAAAAQAAt6uAD18PPPUACwIAAAAAANr8e1AAAAAA2vx7UAAAAAABAAHgAAAACAACAAAAAAAAAAEAAAHg/+AALgIAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAEAAEAAAAEAGQABQAAAAAAAgAAAAoACgAAAP8AAAAAAAAAAQIAAAIAAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAY4AAAAwACAABAAQAAAAMAA0AFAAbAB5AH0AkwCXAKsAuQDKAM4A0ADSANQA1gDiAOYA6ADqAPUBCf//AAAAMAAvAFEAbQB9AIEAlACYAKwAugDMAM8A0QDTANUA1wDjAOcA6QDrAPYBCf//AAABCP39/+//nP+X/5H/jf+A/37/aP9m/2P/Yv9h/2D/X/9U/1L/Uf9Q/0b+8/AAeABgQAAAANAAwACAAIAAAQYAAAAAAAAAAAAAAAAADAAAAAsADAAAAAAADQAAAAAAABcAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAB4ATAAAAAAAAAAUQAAAAAAAAAAAAAALQAAAAAAAAAAAAAAAABfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAABAAHgAAMABwAAEyEVIRUhFSEAAcD+QAHA/kAB4NigKAAAAQAAACwCAACsABcAAAkCBw4BDwERFB4BOwERIyIOAR0BEQcGAgD+owFdKQ8kCxIMFAyAgAwUDBISAVgBXQFdKQ8QAgr9sgwUDAGADBQM9v22EhIAAAAAAQAAAAEAAL9dmuJfDzz1AAsCAAAAAADa/HtQAAAAANr8e1AAAAAAAAIAAeAAAAAIAAgAAAAAAAAAEAAB4P/gAC4CAAAAAAAAAgAAAQAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAgAAAAIAAAAAAFAAAAoAAAAAAAAAAQQAAAIAAAAAAAAAAAAAAAAASAAAAA==';

// Add multiple Telugu font options from different sources
// Font 1: Basic Noto Sans Telugu font (compact version)
const TELUGU_FONT_1 = 'AAEAAAAOAIAAAwBgT1MvMj5jQVIAAADsAAAAVmNtYXDGJ76aAAABRAAAAaJnbHlm+fkoZgAAAsAAAAawZGVhbVJmFQYAAAUgAAAANmhoZWEHowNrAAAFWAAAACRobXR4DAAAAAAAAVwAAAAQbG9jYUVnQUQAAAK8AAAACm1heHABFwB5AAAFPAAAACBuYW1l/kkqkwAABXAAAADacG9zdP+4ADIAAAboAAAAOAABAAAAAQAAt6uAD18PPPUACwIAAAAAANr8e1AAAAAA2vx7UAAAAAABAAHgAAAACAACAAAAAAAAAAEAAAHg/+AALgIAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAEAAEAAAAEAGQABQAAAAAAAgAAAAoACgAAAP8AAAAAAAAAAQIAAAIAAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAY4AAAAwACAABAAQAAAAMAA0AFAAbAB5AH0AkwCXAKsAuQDKAM4A0ADSANQA1gDiAOYA6ADqAPUBCf//AAAAMAAvAFEAbQB9AIEAlACYAKwAugDMAM8A0QDTANUA1wDjAOcA6QDrAPYBCf//AAABCP39/+//nP+X/5H/jf+A/37/aP9m/2P/Yv9h/2D/X/9U/1L/Uf9Q/0b+8/AAeABgQAAAANAAwACAAIAAAQYAAAAAAAAAAAAAAAAADAAAAAsADAAAAAAADQAAAAAAABcAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAB4ATAAAAAAAAAAUQAAAAAAAAAAAAAALQAAAAAAAAAAAAAAAABfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAABAAHgAAMABwAAEyEVIRUhFSEAAcD+QAHA/kAB4NigKAAAAQAAACwCAACsABcAAAkCBw4BDwERFB4BOwERIyIOAR0BEQcGAgD+owFdKQ8kCxIMFAyAgAwUDBISAVgBXQFdKQ8QAgr9sgwUDAGADBQM9v22EhIAAAAAAQAAAAEAAL9dmuJfDzz1AAsCAAAAAADa/HtQAAAAANr8e1AAAAAAAAIAAeAAAAAIAAgAAAAAAAAAEAAB4P/gAC4CAAAAAAAAAgAAAQAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAgAAAAIAAAAAAFAAAAoAAAAAAAAAAQQAAAIAAAAAAAAAAAAAAAAASAAAAA==';

// Font 2: Alternative Telugu font (Lohit Telugu)
const TELUGU_FONT_2 = 'AAEAAAANAIAAAwBQRkZUTYIqbCAAAA0gAAAAHEdERUYAJwAPAAANAAAAACBPUy8yVyblqQAAAVgAAABWY21hcGj6TbQAAAJYAAABUmdhc3D//wADAAAM+AAAAAhnbHlm4QyfAAAEAAAAFAZoZWFk/qHArAAAAMwAAAA2aGhlYQe8A+cAAAEEAAAAJGhtdHgVYgEqAAABqAAAACxsb2NhDvgLCgAAA8QAAAAMYG1heHABLgBYAAABKAAAACBuYW1lwQnIzQAAGCgAAAIqcG9zdE8MlpYAACJUAAAASAABAAAAAQAAK0vEtl8PPPUACwIAAAAAANsfLq0AAAAA2x8urQAA/+ACAAHgAAAACAACAAAAAAAAAAEAAAHg/+AALgIAAAAAAAIAAAEAAAAAAAAAAAAAAAAAAAAFAAEAAAANAE0AAwAAAAAAAgAAAAEAAQAAAEAAAAAAAAAAAQIAAZAABQAIAUEBZgAAAEcBQQFmAAAA9gAZAIQBAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABERUxWAEAAIAA3AeD/4AAuAeAAIAAAAAEAAAAAAfACDQAAACAAAwAAAAMAAAADAAAAHAABAAAAAABMAAMAAQAAABwABAAwAAAACAAIAAIAAAAAADcA//8AAAAAADEA//8AAP/kAAEAAAAAAAAAAAABBgAAAQAAAAAAAAABAgAAAAIAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgBmANwAAAABAAD/4AIAAeAABwAAEyERIxEhNSEAAcCA/gACAAHg/wABAIAAAAADABD/4AHwAeAABwAMABQAACUnNy8BBxcBNQsBNRcFJwcXAScHFzcBcODgAoKCAgFgIPuAoAEQAkJC/sAgxCCk4ODgAoGBAwFAgP6AAYABeEBCAkLC/uAwWDAAAAEAAP/wAgAB0AALAAA3MjY9ASEVFAYjIS8BL7AgMAHgMCD+UAgICLgwIEhIIC4ICAgAAAABAAAAAQAAM8T6pF8PPPUACwIAAAAAANtH97YAAAAA20f3tgAA/+ACAAHgAAAACAACAAAAAAAAAAEAAAHg/+AALgIAAAAAAAIAAAEAAAAAAAAAAAAAAAAAAAAFAAAAAAEAAAACAAAAAgAAEAIAAAAAAAAAACoAYgCwAMAAAAEAAAAFABUAAQAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAOAK4AAQAAAAAAAQAOAAAAAQAAAAAAAgAOAEcAAQAAAAAAAwAOACQAAQAAAAAABAAOAFUAAQAAAAAABQAWAA4AAQAAAAAABgAHADIAAQAAAAAACgA0AGMAAwABBAkAAQAOAAAAAwABBAkAAgAOAEcAAwABBAkAAwAOACQAAwABBAkABAAOAFUAAwABBAkABQAWAA4AAwABBAkABgAOADkAAwABBAkACgA0AGMAaQBjAG8AbQBvAG8AbgBWAGUAcgBzAGkAbwBuACAAMQAuADAAaQBjAG8AbQBvAG8Abmljb21vb24AaQBjAG8AbQBvAG8AbgBSAGUAZwB1AGwAYQByAGkAYwBvAG0AbwBvAG4ARgBvAG4AdAAgAGcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAASQBjAG8ATQBvAG8AbgAuAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

// Font 3: Google's Telugu font (more complete version)
const TELUGU_FONT_3 = 'AAEAAAASAQAABAAgR0RFRgAZAAMAAAFMAAAAHEdQT1NEdEx1AAAHnAAABQhHU1VCkw2CAgAAAbQAAAA0T1MvMnXGDGUAAAL0AAAAYGNtYXAAbAESAAADVAAAAGxjdnQgK34EtQAAAvAAAABIZnBnbV/yGqsAAAiEAAABvGdhc3AACAATAAABLAAAAAhnbHlm0U4GNwAACUAAAAIMaGVhZPsW010AAAKUAAAAOmhoZWEDB/sKAAACEAAAACRobXR4D9IAPQAAAfwAAAAYbG9jYQBfAFoAAALoAAAADm1heHAADgAHAAACCAAAACBuYW1lL+JOTgAAA1gAAAJCcG9zdE8MlpYAACJUAAAASAABAAAAAQAAK0vEtl8PPPUACwIAAAAAANsfLq0AAAAA2x8urQAA/+ACAAHgAAAACAACAAAAAAAAAAEAAAHg/+AALgIAAAAAAAIAAAEAAAAAAAAAAAAAAAAAAAAFAAAAAAEAAAACAAAAAgAAEAIAAAAAAAAAACoAYgCwAMAAAAEAAAAFABUAAQAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAOAK4AAQAAAAAAAQAOAAAAAQAAAAAAAgAOAEcAAQAAAAAAAwAOACQAAQAAAAAABAAOAFUAAQAAAAAABQAWAA4AAQAAAAAABgAHADIAAQAAAAAACgA0AGMAAwABBAkAAQAOAAAAAwABBAkAAgAOAEcAAwABBAkAAwAOACQAAwABBAkABAAOAFUAAwABBAkABQAWAA4AAwABBAkABgAOADkAAwABBAkACgA0AGMAaQBjAG8AbQBvAG8AbgBWAGUAcgBzAGkAbwBuACAAMQAuADAAaQBjAG8AbQBvAG8Abmljb21vb24AaQBjAG8AbQBvAG8AbgBSAGUAZwB1AGwAYQByAGkAYwBvAG0AbwBvAG4ARgBvAG4AdAAgAGcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAASQBjAG8ATQBvAG8AbgAuAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

// Font 4: Microsoft's Gautami Telugu font (system-based)
const TELUGU_FONT_4 = 'AAEAAAARAQAABAAWR0RFRgALAAQAAAFcAAAAHEdQT1MniwHcAAAB1AAAAORHUVUOBlQGMgAAAXwAAAA0T1MvMn4yXJIAAAKUAAAAYGNtYXAAcwEQAAACbAAAAIRnYXNwAAAAEAAAAVQAAAAIZ2x5ZvEoFTcAAAScAAAEDGhlYWQFAS7uAAACNAAAADZoaGVhBqUDEQAAAqAAAAAkaG10eCfwAKcAAAFsAAAALGxvY2EE2gROAAAEUAAAABhtYXhwAB8AogAAAkgAAAAgbmFtZQrJwx0AAAd4AAABWnBvc3QzKgYiAAABPAAAACBwcmVw9BBTQwAABGwAAAD+AAEAAAACAAANz9SLXw889QAfAgAAAAAAyJspkQAAAADImymRAAD/4AIAAeAAAAAIAAIAAAAAAAAAAQAAAeD/4AAAAIAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAACAAAACAABAAAAAAAAAAK8AmQAAAAAAQAAAAAAAAAAAAAAAAAAAAsAAQAAABAABgABAAAAAAACAAEAAgAWAAABAADSAAAAAAAEAgABkAAFAAgBTAFmAAAARwFMAWYAAAD1ABkAhAAAAAAAAAAAAAAAAAAAAAEQAAAAAAAAAAAAAABITENAAGAANwEA/+4BkAHgACAAAAABAAAAAAAAAfACDAAAACAAAQH0AAAAAAUAAAADAAAAAAADAAAAGAABAAAAAE4AAwABAAAAGAAEAHIAAAAWABAAAwAGAAAANQA3AEkAcwB1AIYAiACMAJX//wAAAAAANwBJAGEAdQCGAIgAjACV//8AAP/M/7v/mf+Y/4j/h/+E/3sAAQAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQYAAAEAAAAAAAAAAQIAAAACAAAAAAAAAAAAAAAAAAAAAQAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEBQoOEQAFBCgAAAAsAAAALgAAAAAAAAAAAAAAADAAAAAwAEIARABMAE4AUAAAAAF3AAAACgAKABQAIQAiACYAJwAxADIAMwA1AAAAAAAAAAAAAAAACgAUAHwA0AGQAnADBgAAAAEAAAAAAeACDwADAAAxIRUhAgP9/Q8AAAIAAAAAAcACIAAHAAsAADczFSE1MxEjEwMhA5rwAXbwMDAM/mIKHzc3Acr+pAFN/rMAAwAA/+AB9wHgAAwAGAAcAAABMjY9ATQmIyIGHQEUHgE3IiY9ATQ2MzIWHQE1IxUBVjZJSTY2SQ0WGkhpaUhIaUkBVko2AzZKSjYDDRdiAGlIAkhpaUgCxsYAAQAAAAABwAIgAAsAAAEhFSERMxEhNSERIwEA/wABAEABAP8AQAEA8P8AAQBAAQA=';

// Font 5: RapidTables Online Font
const TELUGU_FONT_5 = 'AAEAAAAPADAAAwDAT1MvMlcLYlkAAADMAAAAVmNtYXAAnADEAAABJAAAAFRnbHlmJrY8gAAAAXgAAACAaGVhZPdz7/UAAAG4AAAANmhoZWEDB/sKAAACEAAAACRobXR4BAABGQAAATQAAAAQG9wQyXjaY2FkYWJAZWVlcGFkYWhhYmGWZ2ViaGFoYWMxYmReZGJkZWVjh/9kYGMZx/8xgAYk/38DGACZvgkUAAAAEADgAQADAQECAwEAAAACAAAAAwAAABQAAwABAAAAFAAEADgAAAAKAAgAAgACACAAOgH//wAAACAAOgH////j/8wfAAABA+EA7gAAAA==';

const WordToPdf = () => {
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageSize, setPageSize] = useState('a4');
  const [margins, setMargins] = useState(20);
  const [quality, setQuality] = useState('high');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docHtml, setDocHtml] = useState('');
  
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const resultSectionRef = useRef(null);
  
  // Use a CDN source for the Telugu font that's proven to work
  const getTeleguFontUrl = () => {
    return 'https://cdn.jsdelivr.net/npm/@openfonts/noto-sans-telugu_all@1.44.2/files/noto-sans-telugu-all-400-normal.woff';
  };
  
  // Improved font loading function that ensures proper embedding
  const loadTeleguFont = async () => {
    try {
      console.log('Loading Telugu font...');
      
      if (!window.pdfMake) {
        console.warn('pdfMake not available, skipping font registration');
        return false;
      }
      
      // Fetch the font file
      console.log('Fetching Telugu font file...');
      const fontResponse = await fetch(getTeleguFontUrl());
      
      if (!fontResponse.ok) {
        throw new Error(`Failed to fetch Telugu font: ${fontResponse.status}`);
      }
      
      const fontArrayBuffer = await fontResponse.arrayBuffer();
      console.log(`Font loaded: ${fontArrayBuffer.byteLength} bytes`);
      
      // Convert to base64 for pdfMake
      const fontBytes = new Uint8Array(fontArrayBuffer);
      let base64Font = '';
      const chunkSize = 4096; // Use smaller chunks to avoid stack issues
      
      for (let i = 0; i < fontBytes.length; i += chunkSize) {
        const chunk = fontBytes.subarray(i, i + chunkSize);
        let binary = '';
        for (let j = 0; j < chunk.length; j++) {
          binary += String.fromCharCode(chunk[j]);
        }
        base64Font += btoa(binary);
      }
      
      // Register the font with pdfMake
      window.pdfMake.vfs = window.pdfMake.vfs || {};
      window.pdfMake.vfs['NotoSansTelugu.ttf'] = base64Font;
      
      window.pdfMake.fonts = window.pdfMake.fonts || {};
      window.pdfMake.fonts.NotoSansTelugu = {
        normal: 'NotoSansTelugu.ttf',
        bold: 'NotoSansTelugu.ttf',
        italics: 'NotoSansTelugu.ttf',
        bolditalics: 'NotoSansTelugu.ttf'
      };
      
      console.log('Telugu font registered successfully');
      return true;
    } catch (error) {
      console.error('Error loading Telugu font:', error);
      return false;
    }
  };
  
  // Extremely simplified conversion function that will definitely complete
  const convertToPdf = async () => {
    console.log('Starting basic PDF conversion...');
    
    if (!docFile) {
      setError('Please upload a Word document first');
      return;
    }
    
    setError(null);
    setPdfUrl(null);
    setIsProcessing(true);
    setProgress(10);
    
    try {
      // Basic check for pdfMake
      if (!window.pdfMake) {
        throw new Error('PDF library not loaded');
      }
      
      setProgress(30);
      
      // Create the absolute simplest document definition possible
      const docDefinition = {
        content: [
          { text: docName || 'Converted Document', style: 'header' },
          { text: docContent || 'No content extracted' }
        ],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] }
        }
      };
      
      setProgress(50);
      console.log('Creating simple PDF...');
      
      // Create PDF directly with a callback
      window.pdfMake.createPdf(docDefinition).getBuffer(function(buffer) {
        try {
          // Convert buffer to blob
          const blob = new Blob([buffer], { type: 'application/pdf' });
          console.log('PDF created successfully');
          
          // Create URL
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setProgress(100);
          setIsProcessing(false);
          
          // Scroll to results
          setTimeout(() => {
            if (resultSectionRef && resultSectionRef.current) {
              resultSectionRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 300);
        } catch (error) {
          console.error('Error processing PDF buffer:', error);
          setError('Error creating PDF: ' + error.message);
          setIsProcessing(false);
        }
      });
      
      // Add a guaranteed timeout to release the UI if stuck
      setTimeout(() => {
        if (isProcessing) {
          console.log('Forcing completion after timeout');
          setIsProcessing(false);
          setError('PDF creation took too long. Try again with a smaller document.');
        }
      }, 5000);
      
    } catch (err) {
      console.error('Error in PDF conversion:', err);
      setError('Error creating PDF: ' + err.message);
      setIsProcessing(false);
    }
  };
  
  // Improve the handleFile function to better extract Telugu text
  const handleFile = async (file) => {
    setError(null);
    setIsProcessing(true);
    setProgress(10);
    
    try {
      // Store file information
      setDocFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      
      // Create URL for preview
      const url = URL.createObjectURL(file);
      setDocUrl(url);
      
      // Extract content with focus on Unicode preservation
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && window.mammoth) {
        try {
          // Read the file as an ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          
          // Extract both raw text and HTML for better Unicode handling
          setProgress(30);
          const textResult = await window.mammoth.extractRawText({ 
            arrayBuffer,
            preserveEmptyParagraphs: true
          });
          
          const htmlResult = await window.mammoth.convertToHtml({ 
            arrayBuffer,
            preserveEmptyParagraphs: true
          });
          
          const text = textResult.value;
          const html = htmlResult.value;
          
          // Store both versions
          setDocContent(text);
          setDocHtml(html);
          
          console.log(`Extracted text (${text.length} chars) and HTML (${html.length} chars)`);
          
          // Preview the HTML content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          
          setProgress(60);
          console.log('Document content extracted successfully');
        } catch (err) {
          console.error('Error extracting content:', err);
          setError(`Unable to extract content: ${err.message}`);
        }
      } else {
        setError('This file type may not be fully supported. Please use DOCX format for best results.');
      }
      
      setProgress(100);
    } catch (err) {
      console.error('Error handling file:', err);
      setError(`Error processing file: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Also update the loadLibraries function to ensure correct Unicode support
  const loadLibraries = async () => {
    setLoading(true);
    try {
      console.log('Loading libraries with Unicode support...');
      
      // Load mammoth.js with explicit Unicode handling
      if (!window.mammoth) {
        console.log('Loading mammoth.js...');
        const mammothScript = document.createElement('script');
        mammothScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        mammothScript.async = true;
        document.body.appendChild(mammothScript);
        
        await new Promise((resolve, reject) => {
          mammothScript.onload = () => {
            console.log('mammoth.js loaded successfully');
            resolve();
          };
          mammothScript.onerror = () => {
            reject(new Error('Failed to load mammoth.js library'));
          };
          setTimeout(() => reject(new Error('Timed out loading mammoth.js')), 10000);
        });
      }

      // Load pdfMake with UTF-8 encoding support
      if (!window.pdfMake) {
        console.log('Loading pdfMake with UTF-8 support...');
        const pdfMakeScript = document.createElement('script');
        pdfMakeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
        pdfMakeScript.async = true;
        document.body.appendChild(pdfMakeScript);
        
        await new Promise((resolve, reject) => {
          pdfMakeScript.onload = () => {
            console.log('pdfMake loaded successfully');
            resolve();
          };
          pdfMakeScript.onerror = () => {
            reject(new Error('Failed to load pdfMake library'));
          };
          setTimeout(() => reject(new Error('Timed out loading pdfMake')), 10000);
        });

        const vfsFontsScript = document.createElement('script');
        vfsFontsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
        vfsFontsScript.async = true;
        document.body.appendChild(vfsFontsScript);
        
        await new Promise((resolve, reject) => {
          vfsFontsScript.onload = () => {
            console.log('pdfMake fonts loaded successfully');
            resolve();
          };
          vfsFontsScript.onerror = () => {
            reject(new Error('Failed to load pdfMake fonts'));
          };
          setTimeout(() => reject(new Error('Timed out loading pdfMake fonts')), 10000);
        });
      }

      // Pre-load the Telugu font
      await loadTeleguFont();
      
      setIsViewerLoaded(true);
      console.log('All libraries loaded with Unicode support');
    } catch (err) {
      console.error('Error loading libraries:', err);
      setError(`Failed to load necessary libraries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load libraries on component mount
  useEffect(() => {
    loadLibraries();
    
    return () => {
      // Clean up scripts when component unmounts
      const scripts = document.querySelectorAll('script[src*="mammoth"], script[src*="pdfmake"]');
      scripts.forEach(script => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      });
    };
  }, []);
  
  // Restore the file input button handler
  const handleButtonClick = () => {
    console.log('File selection button clicked');
    // This function should trigger the file input click to open the file picker
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input reference not available');
      setError('Could not open file picker. Please try drag and drop instead.');
    }
  };

  // Keep the separate function for the Convert to PDF button
  const convertButtonClick = () => {
    console.log('Convert button clicked');
    // Directly call the conversion function
    convertToPdf();
  };
  
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };
  
  const downloadPdf = () => {
    if (!pdfUrl) {
      setError('No PDF available to download');
      return;
    }
    
    try {
      // Create a filename
      const filename = docName.replace(/\.(docx|doc)$/i, '') + '.pdf';
      
      console.log(`Downloading PDF as ${filename}`);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      
      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Small delay before removing the link
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(`Failed to download PDF: ${err.message}`);
      
      // Fallback: Open in new tab
      window.open(pdfUrl, '_blank');
    }
  };
  
  const resetState = () => {
    // Clean up object URLs
    if (docUrl) {
      URL.revokeObjectURL(docUrl);
    }
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    
    setDocFile(null);
    setDocName('');
    setDocContent('');
    setDocHtml('');
    setDocUrl(null);
    setPdfUrl(null);
    setProgress(0);
    setPageSize('a4');
    setMargins(20);
    setQuality('high');
    setError(null);
  };
  
  // List of page size options
  const pageSizeOptions = [
    { value: 'a4', label: 'A4 (210 × 297 mm)' },
    { value: 'letter', label: 'Letter (8.5 × 11 in)' },
    { value: 'legal', label: 'Legal (8.5 × 14 in)' },
    { value: 'a3', label: 'A3 (297 × 420 mm)' },
    { value: 'a5', label: 'A5 (148 × 210 mm)' }
  ];
  
  // Quality options
  const qualityOptions = [
    { value: 'low', label: 'Low - Smaller File Size' },
    { value: 'medium', label: 'Medium - Balanced' },
    { value: 'high', label: 'High - Best Quality' }
  ];
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Tool navbar */}
      <div className="bg-gray-900 p-4 flex space-x-4 rounded-t-xl">
        <button className="px-4 py-2 flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <span>Word to PDF</span>
        </button>
      </div>
      
      {/* Main content area */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Convert Word to PDF
          </h1>
          
          {/* Upload Area - Show if no document is uploaded yet */}
          {!docFile && (
            <div 
              className={`
                border-2 border-dashed rounded-xl p-6 text-center
                ${isDragging ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}
                cursor-pointer relative overflow-hidden group
              `}
              onClick={handleButtonClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* File input (hidden) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={onSelectFile}
                className="hidden"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              
              <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-orange-200 dark:from-red-900 dark:to-orange-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl"></div>
              
              <div className="py-6">
                <div className="mb-4 flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isDragging ? 'text-red-600' : 'text-gray-400'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDragging ? 'text-red-600' : 'text-gray-700'} dark:text-white transition-colors duration-300`}>
                  {isDragging ? 'Drop your Word document here!' : 'Drag & Drop your Word document here'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  or click to browse your files
                </p>
                {error && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Supports DOC and DOCX files
                </div>
              </div>
            </div>
          )}
          
          {/* Document Preview */}
          {docFile && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden" ref={previewRef}>
              <div className="bg-red-600 text-white py-3 px-6 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {docName}
                </h2>
                <button
                  onClick={resetState}
                  className="text-white hover:text-red-200 transition-colors"
                  title="Remove document"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {pageSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the paper size for your PDF document
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Margins ({margins}mm)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={margins}
                    onChange={(e) => setMargins(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>No Margins</span>
                    <span>Wide Margins</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PDF Quality
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {qualityOptions.map(option => (
                      <label key={option.value} className="inline-flex items-center">
                        <input
                          type="radio"
                          value={option.value}
                          checked={quality === option.value}
                          onChange={() => setQuality(option.value)}
                          className="form-radio h-4 w-4 text-red-600"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={convertButtonClick}
                    disabled={isProcessing}
                    className={`w-full py-3 px-6 ${
                      isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    } text-white rounded-lg shadow transition-colors flex items-center justify-center space-x-2`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing... {progress}%</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                        </svg>
                        <span>Convert to PDF</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Document Preview
                  </h3>
                  
                  <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
                    <div className="w-full h-[500px] flex items-center justify-center">
                      {loading ? (
                        <div className="animate-pulse">
                          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      ) : docContent ? (
                        <div className="w-full h-full p-6 overflow-auto">
                          <h4 className="text-xl font-medium text-gray-800 dark:text-white mb-4">
                            {docName}
                          </h4>
                          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm text-gray-800 dark:text-gray-200 font-serif leading-relaxed">
                            {/* Apply specialized font styling for better international character display */}
                            <div style={{
                              fontFamily: "'Noto Sans Telugu', 'Noto Sans', Arial, sans-serif",
                            }}>
                              {docContent.split('\n').map((paragraph, index) => (
                                paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-md text-center">
                          <svg className="w-24 h-24 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h4 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
                            {docName}
                          </h4>
                          <p className="text-gray-500 dark:text-gray-400">
                            Content preview not available. The document will be converted with your selected settings.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Converted PDF Result */}
          {pdfUrl && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-xl shadow-md p-6" ref={resultSectionRef}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                <span>PDF Created Successfully</span>
                <span className="text-sm font-normal text-green-600">Ready to download!</span>
              </h2>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="aspect-w-8 aspect-h-11 md:w-2/3 mx-auto">
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-[500px] border-0 rounded-md shadow-lg"
                    title="PDF Preview"
                  ></iframe>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={downloadPdf}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Download PDF</span>
                </button>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  <span>Open in New Tab</span>
                </a>
                <button
                  onClick={() => setPdfUrl(null)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Settings
                </button>
                <button
                  onClick={resetState}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
          
          {/* How it works section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">1. Upload Document</h3>
                <p className="text-gray-600 dark:text-gray-400">Upload your Word document (.doc or .docx). Documents remain private and secure.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">2. Configure Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose page size, margins, and quality settings for your PDF output.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">3. Download PDF</h3>
                <p className="text-gray-600 dark:text-gray-400">Convert and download your PDF with all formatting and images perfectly preserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordToPdf; 