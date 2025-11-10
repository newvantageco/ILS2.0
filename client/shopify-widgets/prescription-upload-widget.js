/**
 * ILS 2.0 Shopify Prescription Upload Widget
 *
 * Embeddable widget for Shopify storefronts to allow customers to upload prescriptions
 *
 * Installation:
 * 1. Add to your Shopify theme:
 *    <div id="ils-prescription-upload" data-store-id="YOUR_STORE_ID"></div>
 *    <script src="https://your-ils-domain.com/shopify-widgets/prescription-upload-widget.js"></script>
 *
 * 2. Configure via data attributes:
 *    data-store-id="..." - Required: Your ILS Shopify store ID
 *    data-order-id="..." - Optional: Link to specific order
 *    data-patient-id="..." - Optional: Link to specific patient
 */

(function() {
  'use strict';

  // Widget configuration
  const CONFIG = {
    apiBaseUrl: window.ILS_API_URL || 'https://api.ils2.com',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  };

  // Widget state
  let widgetState = {
    uploading: false,
    uploadProgress: 0,
    uploadedFiles: [],
    currentUpload: null,
  };

  /**
   * Initialize prescription upload widget
   */
  function initPrescriptionUploadWidget() {
    const containers = document.querySelectorAll('#ils-prescription-upload');

    containers.forEach(container => {
      const storeId = container.getAttribute('data-store-id');
      const orderId = container.getAttribute('data-order-id');
      const patientId = container.getAttribute('data-patient-id');

      if (!storeId) {
        console.error('ILS Prescription Upload Widget: data-store-id is required');
        return;
      }

      renderWidget(container, { storeId, orderId, patientId });
    });
  }

  /**
   * Render widget HTML
   */
  function renderWidget(container, config) {
    container.innerHTML = `
      <div class="ils-prescription-widget">
        <div class="ils-widget-header">
          <h3>Upload Your Prescription</h3>
          <p class="ils-widget-subtitle">
            Upload a photo or PDF of your prescription. Our AI will automatically extract the details.
          </p>
        </div>

        <div class="ils-upload-area" id="ils-upload-dropzone">
          <div class="ils-upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p class="ils-upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p class="ils-upload-hint">
            JPG, PNG, WEBP, or PDF (max 10MB)
          </p>
          <input
            type="file"
            id="ils-file-input"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            style="display: none;"
          />
        </div>

        <div class="ils-upload-progress" id="ils-upload-progress" style="display: none;">
          <div class="ils-progress-bar">
            <div class="ils-progress-fill" id="ils-progress-fill" style="width: 0%"></div>
          </div>
          <p class="ils-progress-text" id="ils-progress-text">Uploading... 0%</p>
        </div>

        <div class="ils-upload-success" id="ils-upload-success" style="display: none;">
          <div class="ils-success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="16 8 10 14 8 12"></polyline>
            </svg>
          </div>
          <h4>Prescription Uploaded Successfully!</h4>
          <div id="ils-extracted-data"></div>
          <button class="ils-btn ils-btn-secondary" id="ils-upload-another">
            Upload Another
          </button>
        </div>

        <div class="ils-upload-error" id="ils-upload-error" style="display: none;">
          <div class="ils-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h4>Upload Failed</h4>
          <p id="ils-error-message"></p>
          <button class="ils-btn ils-btn-secondary" id="ils-retry-upload">
            Try Again
          </button>
        </div>

        <div class="ils-uploaded-files" id="ils-uploaded-files" style="display: none;">
          <h4>Uploaded Prescriptions</h4>
          <div id="ils-file-list"></div>
        </div>

        <div class="ils-widget-footer">
          <p class="ils-security-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Your prescription is securely encrypted and HIPAA compliant
          </p>
        </div>
      </div>
    `;

    // Attach event listeners
    attachEventListeners(container, config);
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners(container, config) {
    const dropzone = container.querySelector('#ils-upload-dropzone');
    const fileInput = container.querySelector('#ils-file-input');

    // Click to upload
    dropzone.addEventListener('click', () => {
      if (!widgetState.uploading) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file, config, container);
      }
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('ils-drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('ils-drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('ils-drag-over');

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file, config, container);
      }
    });

    // Upload another button
    const uploadAnotherBtn = container.querySelector('#ils-upload-another');
    if (uploadAnotherBtn) {
      uploadAnotherBtn.addEventListener('click', () => {
        resetWidget(container, config);
      });
    }

    // Retry button
    const retryBtn = container.querySelector('#ils-retry-upload');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        resetWidget(container, config);
      });
    }
  }

  /**
   * Handle file upload
   */
  async function handleFileUpload(file, config, container) {
    // Validate file
    if (!validateFile(file, container)) {
      return;
    }

    widgetState.uploading = true;
    widgetState.uploadProgress = 0;

    // Show progress UI
    showProgress(container);

    try {
      // Upload file to cloud storage (e.g., S3, Cloudinary)
      const fileUrl = await uploadFileToStorage(file, (progress) => {
        widgetState.uploadProgress = progress;
        updateProgress(container, progress);
      });

      // Submit to ILS API for processing
      const result = await submitPrescriptionUpload({
        storeId: config.storeId,
        orderId: config.orderId,
        patientId: config.patientId,
        fileUrl: fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      widgetState.currentUpload = result;
      widgetState.uploadedFiles.push(result);

      // Show success with extracted data
      showSuccess(container, result);

      // Trigger custom event for parent page
      triggerCustomEvent('prescriptionUploaded', result);

    } catch (error) {
      console.error('Upload failed:', error);
      showError(container, error.message || 'Upload failed. Please try again.');
      triggerCustomEvent('prescriptionUploadFailed', { error: error.message });
    } finally {
      widgetState.uploading = false;
    }
  }

  /**
   * Validate file
   */
  function validateFile(file, container) {
    // Check file size
    if (file.size > CONFIG.maxFileSize) {
      showError(container, `File size must be less than ${CONFIG.maxFileSize / 1024 / 1024}MB`);
      return false;
    }

    // Check file type
    if (!CONFIG.acceptedFormats.includes(file.type)) {
      showError(container, 'Invalid file format. Please upload JPG, PNG, WEBP, or PDF');
      return false;
    }

    return true;
  }

  /**
   * Upload file to storage
   */
  async function uploadFileToStorage(file, onProgress) {
    // This is a placeholder - implement your actual file upload logic
    // You can use S3, Cloudinary, or your own server

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      // Replace with your actual upload endpoint
      xhr.open('POST', `${CONFIG.apiBaseUrl}/upload/prescription`);
      xhr.send(formData);
    });
  }

  /**
   * Submit prescription upload to ILS API
   */
  async function submitPrescriptionUpload(data) {
    const response = await fetch(`${CONFIG.apiBaseUrl}/api/shopify/prescriptions/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  }

  /**
   * Show progress UI
   */
  function showProgress(container) {
    container.querySelector('#ils-upload-dropzone').style.display = 'none';
    container.querySelector('#ils-upload-success').style.display = 'none';
    container.querySelector('#ils-upload-error').style.display = 'none';
    container.querySelector('#ils-upload-progress').style.display = 'block';
  }

  /**
   * Update progress
   */
  function updateProgress(container, progress) {
    const progressFill = container.querySelector('#ils-progress-fill');
    const progressText = container.querySelector('#ils-progress-text');

    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Uploading... ${progress}%`;
  }

  /**
   * Show success UI
   */
  function showSuccess(container, result) {
    container.querySelector('#ils-upload-progress').style.display = 'none';
    container.querySelector('#ils-upload-success').style.display = 'block';

    // Display extracted prescription data if available
    if (result.aiExtractedData) {
      const extractedDataDiv = container.querySelector('#ils-extracted-data');
      extractedDataDiv.innerHTML = renderExtractedData(result.aiExtractedData, result.requiresReview);
    }
  }

  /**
   * Show error UI
   */
  function showError(container, message) {
    container.querySelector('#ils-upload-dropzone').style.display = 'none';
    container.querySelector('#ils-upload-progress').style.display = 'none';
    container.querySelector('#ils-upload-success').style.display = 'none';
    container.querySelector('#ils-upload-error').style.display = 'block';
    container.querySelector('#ils-error-message').textContent = message;
  }

  /**
   * Reset widget
   */
  function resetWidget(container, config) {
    container.querySelector('#ils-upload-dropzone').style.display = 'block';
    container.querySelector('#ils-upload-progress').style.display = 'none';
    container.querySelector('#ils-upload-success').style.display = 'none';
    container.querySelector('#ils-upload-error').style.display = 'none';
    container.querySelector('#ils-file-input').value = '';
  }

  /**
   * Render extracted prescription data
   */
  function renderExtractedData(data, requiresReview) {
    let html = '<div class="ils-extracted-prescription">';

    if (requiresReview) {
      html += `
        <div class="ils-review-notice">
          <p>⚠️ This prescription requires manual verification. We'll notify you once it's verified.</p>
        </div>
      `;
    }

    html += '<table class="ils-prescription-table">';
    html += '<thead><tr><th></th><th>Right Eye (OD)</th><th>Left Eye (OS)</th></tr></thead>';
    html += '<tbody>';

    if (data.sphereOD !== null || data.sphereOS !== null) {
      html += `<tr><td>Sphere</td><td>${formatValue(data.sphereOD)}</td><td>${formatValue(data.sphereOS)}</td></tr>`;
    }
    if (data.cylinderOD !== null || data.cylinderOS !== null) {
      html += `<tr><td>Cylinder</td><td>${formatValue(data.cylinderOD)}</td><td>${formatValue(data.cylinderOS)}</td></tr>`;
    }
    if (data.axisOD !== null || data.axisOS !== null) {
      html += `<tr><td>Axis</td><td>${formatValue(data.axisOD)}°</td><td>${formatValue(data.axisOS)}°</td></tr>`;
    }
    if (data.addOD !== null || data.addOS !== null) {
      html += `<tr><td>Add</td><td>${formatValue(data.addOD)}</td><td>${formatValue(data.addOS)}</td></tr>`;
    }
    if (data.pd !== null) {
      html += `<tr><td>PD</td><td colspan="2">${data.pd}mm</td></tr>`;
    }

    html += '</tbody></table>';

    if (data.prescriptionDate) {
      html += `<p class="ils-prescription-date">Date: ${formatDate(data.prescriptionDate)}</p>`;
    }

    html += '</div>';

    return html;
  }

  /**
   * Format value for display
   */
  function formatValue(value) {
    if (value === null || value === undefined) {
      return '-';
    }
    return value > 0 ? `+${value}` : value;
  }

  /**
   * Format date for display
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /**
   * Trigger custom event
   */
  function triggerCustomEvent(eventName, detail) {
    const event = new CustomEvent(`ils:${eventName}`, {
      detail: detail,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrescriptionUploadWidget);
  } else {
    initPrescriptionUploadWidget();
  }

  // Expose public API
  window.ILSPrescriptionWidget = {
    init: initPrescriptionUploadWidget,
    reset: resetWidget,
    getUploadedFiles: () => widgetState.uploadedFiles,
  };

})();
