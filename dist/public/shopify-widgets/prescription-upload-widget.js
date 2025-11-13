/**
 * ILS 2.0 Prescription Upload Widget for Shopify
 *
 * Allows customers to upload their prescription on Shopify product pages
 * with AI-powered OCR extraction using GPT-4 Vision
 *
 * Installation:
 * <div id="ils-prescription-upload"
 *      data-ils-api="https://your-ils-domain.com"
 *      data-store-id="YOUR_STORE_ID"
 *      data-order-id="SHOPIFY_ORDER_ID">
 * </div>
 * <script src="https://your-ils-domain.com/shopify-widgets/prescription-upload-widget.js"></script>
 */

(function() {
  'use strict';

  class PrescriptionUploadWidget {
    constructor(container) {
      this.container = container;
      this.apiUrl = container.getAttribute('data-ils-api');
      this.storeId = container.getAttribute('data-store-id');
      this.orderId = container.getAttribute('data-order-id');
      this.uploadedFile = null;
      this.extractedData = null;

      this.render();
      this.attachEventListeners();
    }

    render() {
      this.container.innerHTML = `
        <div class="ils-prescription-widget" style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 600px;
          margin: 20px 0;
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        ">
          <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1e293b;">
            📋 Upload Your Prescription
          </h3>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Upload a photo or PDF of your prescription. Our AI will automatically extract the values for you.
          </p>

          <div class="ils-upload-area" style="
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            <input type="file" id="ils-prescription-file" accept="image/*,.pdf" style="display: none;">
            <div class="ils-upload-prompt">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="margin: 0 auto 12px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p style="margin: 0; font-size: 16px; font-weight: 500; color: #1e293b;">
                Click to upload or drag and drop
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
            <div class="ils-upload-preview" style="display: none;"></div>
          </div>

          <div class="ils-loading" style="display: none; margin-top: 20px; text-align: center;">
            <div style="
              display: inline-block;
              width: 40px;
              height: 40px;
              border: 4px solid #e5e7eb;
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            "></div>
            <p style="margin: 12px 0 0; font-size: 14px; color: #64748b;">
              Analyzing prescription with AI...
            </p>
          </div>

          <div class="ils-extracted-data" style="display: none; margin-top: 20px;">
            <h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e293b;">
              ✅ Extracted Prescription Values
            </h4>
            <div class="ils-data-grid" style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 12px;
            "></div>
            <p style="margin: 16px 0 0; font-size: 13px; color: #64748b;">
              <strong>Confidence:</strong> <span class="ils-confidence"></span>
            </p>
            <div class="ils-low-confidence" style="display: none; margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #92400e;">
                ⚠️ Low confidence detected. Your prescription will be manually reviewed before processing.
              </p>
            </div>
          </div>

          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .ils-upload-area:hover {
              border-color: #3b82f6;
              background: #f8fafc;
            }
          </style>
        </div>
      `;
    }

    attachEventListeners() {
      const uploadArea = this.container.querySelector('.ils-upload-area');
      const fileInput = this.container.querySelector('#ils-prescription-file');

      uploadArea.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });

      // Drag and drop
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#3b82f6';
        uploadArea.style.background = '#eff6ff';
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#cbd5e1';
        uploadArea.style.background = 'white';
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#cbd5e1';
        uploadArea.style.background = 'white';

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    async handleFileUpload(file) {
      this.uploadedFile = file;

      // Show file preview
      const preview = this.container.querySelector('.ils-upload-preview');
      const prompt = this.container.querySelector('.ils-upload-prompt');
      prompt.style.display = 'none';
      preview.style.display = 'block';
      preview.innerHTML = `
        <p style="margin: 0; font-size: 14px; color: #1e293b;">
          <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)
        </p>
      `;

      // Show loading
      this.container.querySelector('.ils-loading').style.display = 'block';
      this.container.querySelector('.ils-extracted-data').style.display = 'none';

      try {
        // Convert file to base64
        const base64 = await this.fileToBase64(file);

        // Upload to ILS API
        const response = await fetch(`${this.apiUrl}/api/shopify/public/prescription-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopifyOrderId: this.orderId,
            prescriptionImageUrl: base64,
          }),
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        this.extractedData = data;

        // Hide loading, show results
        this.container.querySelector('.ils-loading').style.display = 'none';
        this.showExtractedData(data);

      } catch (error) {
        console.error('Prescription upload error:', error);
        alert('Failed to process prescription. Please try again.');
        this.container.querySelector('.ils-loading').style.display = 'none';
      }
    }

    showExtractedData(data) {
      const extractedDataDiv = this.container.querySelector('.ils-extracted-data');
      const dataGrid = this.container.querySelector('.ils-data-grid');
      const confidenceSpan = this.container.querySelector('.ils-confidence');
      const lowConfidenceDiv = this.container.querySelector('.ils-low-confidence');

      const rx = data.extractedData;

      dataGrid.innerHTML = `
        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <strong style="font-size: 12px; color: #64748b;">Right Eye (OD)</strong>
          <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b;">
            SPH: ${rx.rightEye.sphere}<br>
            CYL: ${rx.rightEye.cylinder}<br>
            AXIS: ${rx.rightEye.axis}
          </p>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <strong style="font-size: 12px; color: #64748b;">Left Eye (OS)</strong>
          <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b;">
            SPH: ${rx.leftEye.sphere}<br>
            CYL: ${rx.leftEye.cylinder}<br>
            AXIS: ${rx.leftEye.axis}
          </p>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <strong style="font-size: 12px; color: #64748b;">PD</strong>
          <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b;">${rx.pd || 'Not specified'}</p>
        </div>
      `;

      confidenceSpan.textContent = `${data.confidence}%`;

      if (data.needsReview) {
        lowConfidenceDiv.style.display = 'block';
      }

      extractedDataDiv.style.display = 'block';

      // Dispatch custom event for parent page
      window.dispatchEvent(new CustomEvent('ils-prescription-uploaded', {
        detail: { prescriptionId: data.prescriptionId, extractedData: rx }
      }));
    }

    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  // Auto-initialize
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('#ils-prescription-upload');
    containers.forEach(container => new PrescriptionUploadWidget(container));
  });

})();
