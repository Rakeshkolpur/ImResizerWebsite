import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FaFileUpload, FaDownload, FaTrash, FaCompress } from 'react-icons/fa';
import styles from './PDFCompressor.module.css';
import { 
  compressPDF, 
  compressPDFToTargetSize, 
  getPDFPageCount, 
  calculateFileSize,
  formatFileSize
} from '../../../utils/pdfProcessing';

const PDFCompressor = () => {
  // State
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedFile, setCompressedFile] = useState(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionError, setCompressionError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [compressionPercent, setCompressionPercent] = useState(0);
  const fileInputRef = useRef(null);

  // Compression settings
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 80, // Default quality (1-100)
    imageQuality: 70, // Quality for embedded images
    compressImages: true, // Whether to compress embedded images
    removeMetadata: true, // Whether to remove metadata
    targetSize: null, // Target file size in KB
  });

  // Quality presets
  const qualityPresets = [30, 40, 50, 60, 70, 80, 90, 95];
  
  // Size presets in KB
  const sizePresets = [100, 200, 500, 1000, 2000, 5000, 10000];
  
  // KB size with text label
  const getKbSizeLabel = (kb) => {
    if (kb >= 1000) {
      return `${(kb / 1000).toFixed(1)} MB`;
    }
    return `${kb} KB`;
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        setSelectedFile(file);
        const fileSizeKB = calculateFileSize(file);
        setOriginalSize(fileSizeKB);
        setCompressedFile(null);
        setCompressedSize(0);
        setCompressionError(null);
        
        // Load PDF to get page count
        const arrayBuffer = await file.arrayBuffer();
        const pageCount = await getPDFPageCount(arrayBuffer);
        setPageCount(pageCount);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setCompressionError('Failed to load PDF. Please try another file.');
      }
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        setSelectedFile(file);
        const fileSizeKB = calculateFileSize(file);
        setOriginalSize(fileSizeKB);
        setCompressedFile(null);
        setCompressedSize(0);
        setCompressionError(null);
        
        // Load PDF to get page count
        const arrayBuffer = await file.arrayBuffer();
        const pageCount = await getPDFPageCount(arrayBuffer);
        setPageCount(pageCount);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setCompressionError('Failed to load PDF. Please try another file.');
      }
    } else {
      setCompressionError('Please select a PDF file.');
    }
  };

  // Compress PDF
  const compressPDFFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setCompressionError(null);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      let compressedBytes;
      
      if (compressionSettings.targetSize) {
        // Compress to target size
        compressedBytes = await compressPDFToTargetSize(
          arrayBuffer, 
          compressionSettings.targetSize
        );
      } else {
        // Compress with quality settings
        compressedBytes = await compressPDF(arrayBuffer, {
          quality: compressionSettings.quality / 100,
          imageQuality: compressionSettings.imageQuality / 100,
          compressImages: compressionSettings.compressImages,
          removeMetadata: compressionSettings.removeMetadata,
        });
      }
      
      // Create compressed file
      const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const compressedFile = new File([compressedBlob], `compressed_${selectedFile.name}`, {
        type: 'application/pdf',
        lastModified: new Date().getTime(),
      });
      
      setCompressedFile(compressedFile);
      const compressedSizeKB = calculateFileSize(compressedFile);
      setCompressedSize(compressedSizeKB);
      
      // Calculate compression percentage
      const reduction = originalSize - compressedSizeKB;
      const percent = (reduction / originalSize) * 100;
      setCompressionPercent(percent);
      
    } catch (error) {
      console.error('Error compressing PDF:', error);
      setCompressionError('Failed to compress PDF. Please try again or use a different file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle target size change
  const handleTargetSizeChange = (size) => {
    setCompressionSettings({
      ...compressionSettings,
      targetSize: size,
      // Automatically adjust quality based on target size
      quality: Math.max(30, Math.min(95, Math.round(100 - (size / originalSize) * 50))),
    });
  };

  // Handle quality change
  const handleQualityChange = (quality) => {
    setCompressionSettings({
      ...compressionSettings,
      quality,
      targetSize: null, // Clear target size when manually setting quality
    });
  };

  // Download compressed file
  const downloadCompressedFile = () => {
    if (!compressedFile) return;
    
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset
  const resetCompression = () => {
    setSelectedFile(null);
    setOriginalSize(0);
    setCompressedFile(null);
    setCompressedSize(0);
    setCompressionError(null);
    setPageCount(0);
    setCompressionPercent(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <FaCompress />
        </div>
        <div className={styles.title}>
          <h1>PDF Compressor</h1>
          <p>Reduce the size of your PDF documents</p>
        </div>
      </div>

      {!selectedFile ? (
        <div 
          className={`${styles.dropArea} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FaFileUpload className={styles.uploadIcon} />
          <p>Drag & drop your PDF file here or</p>
          <button 
            className={styles.uploadButton}
            onClick={() => fileInputRef.current.click()}
          >
            Select PDF
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            className={styles.fileInput}
          />
        </div>
      ) : (
        <div className={styles.compressionContainer}>
          <div className={styles.fileInfo}>
            <div className={styles.fileDetails}>
              <div className={styles.fileName}>{selectedFile.name}</div>
              <div className={styles.fileSize}>{formatFileSize(originalSize)} • {pageCount} pages</div>
            </div>
            <button 
              className={styles.removeButton}
              onClick={resetCompression}
            >
              <FaTrash /> Remove
            </button>
          </div>

          <div className={styles.compressionSettings}>
            <h3>Compression Settings</h3>
            
            <div className={styles.settingGroup}>
              <label>Target Size</label>
              <div className={styles.sizePresets}>
                {sizePresets.map(size => (
                  <button
                    key={size}
                    className={`${styles.presetButton} ${compressionSettings.targetSize === size ? styles.active : ''}`}
                    onClick={() => handleTargetSizeChange(size)}
                  >
                    {formatFileSize(size)}
                  </button>
                ))}
              </div>
              
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="10"
                  max={Math.max(10000, originalSize)}
                  step="10"
                  value={compressionSettings.targetSize || originalSize / 2}
                  onChange={(e) => handleTargetSizeChange(Number(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderValue}>
                  {formatFileSize(compressionSettings.targetSize || Math.round(originalSize / 2))}
                </div>
              </div>
            </div>
            
            <div className={styles.settingGroup}>
              <label>Quality</label>
              <div className={styles.qualityPresets}>
                {qualityPresets.map(quality => (
                  <button
                    key={quality}
                    className={`${styles.presetButton} ${compressionSettings.quality === quality ? styles.active : ''}`}
                    onClick={() => handleQualityChange(quality)}
                  >
                    {quality}%
                  </button>
                ))}
              </div>
              
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={compressionSettings.quality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderValue}>
                  {compressionSettings.quality}%
                </div>
              </div>
            </div>
            
            <div className={styles.settingGroup}>
              <label>Advanced Options</label>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={compressionSettings.compressImages}
                    onChange={(e) => setCompressionSettings({
                      ...compressionSettings,
                      compressImages: e.target.checked
                    })}
                  />
                  Compress embedded images
                </label>
                
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={compressionSettings.removeMetadata}
                    onChange={(e) => setCompressionSettings({
                      ...compressionSettings,
                      removeMetadata: e.target.checked
                    })}
                  />
                  Remove metadata
                </label>
              </div>
            </div>
            
            <button
              className={styles.compressButton}
              onClick={compressPDFFile}
              disabled={isProcessing}
            >
              {isProcessing ? 'Compressing...' : 'Compress PDF'}
            </button>
          </div>

          {compressionError && (
            <div className={styles.errorMessage}>
              {compressionError}
            </div>
          )}

          {compressedFile && (
            <div className={styles.resultContainer}>
              <div className={styles.compressionResult}>
                <h3>Compression Complete!</h3>
                
                <div className={styles.resultDetails}>
                  <div className={styles.resultItem}>
                    <span>Original size:</span>
                    <span>{formatFileSize(originalSize)}</span>
                  </div>
                  
                  <div className={styles.resultItem}>
                    <span>Compressed size:</span>
                    <span>{formatFileSize(compressedSize)}</span>
                  </div>
                  
                  <div className={styles.resultItem}>
                    <span>Reduction:</span>
                    <span className={compressionPercent > 0 ? styles.reduction : ''}>
                      {compressionPercent > 0 
                        ? `${compressionPercent.toFixed(1)}% smaller` 
                        : '0% (no reduction)'}
                    </span>
                  </div>
                </div>
                
                <button
                  className={styles.downloadButton}
                  onClick={downloadCompressedFile}
                >
                  <FaDownload /> Download
                </button>
                
                <button
                  className={styles.tryAgainButton}
                  onClick={() => {
                    setCompressedFile(null);
                    setCompressedSize(0);
                  }}
                >
                  Try Different Compression Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFCompressor; 