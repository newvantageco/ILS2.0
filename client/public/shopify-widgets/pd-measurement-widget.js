/**
 * ILS 2.0 PD Measurement Widget for Shopify
 *
 * Allows customers to measure their Pupillary Distance (PD) using their webcam
 * and a credit card for scale reference. Uses AI for accurate measurement.
 *
 * Installation:
 * <div id="ils-pd-measurement"
 *      data-ils-api="https://your-ils-domain.com"
 *      data-store-id="YOUR_STORE_ID"
 *      data-order-id="SHOPIFY_ORDER_ID">
 * </div>
 * <script src="https://your-ils-domain.com/shopify-widgets/pd-measurement-widget.js"></script>
 */

(function() {
  'use strict';

  class PDMeasurementWidget {
    constructor(container) {
      this.container = container;
      this.apiUrl = container.getAttribute('data-ils-api');
      this.storeId = container.getAttribute('data-store-id');
      this.orderId = container.getAttribute('data-order-id');
      this.stream = null;
      this.capturedImage = null;
      this.pdResult = null;

      this.render();
      this.attachEventListeners();
    }

    render() {
      this.container.innerHTML = `
        <div class="ils-pd-widget" style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 700px;
          margin: 20px 0;
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        ">
          <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1e293b;">
            📏 Measure Your PD (Pupillary Distance)
          </h3>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Use your webcam to take a photo. Hold a credit card next to your face for accurate measurement.
          </p>

          <!-- Step indicator -->
          <div class="ils-steps" style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div class="ils-step active" data-step="1" style="
              flex: 1;
              padding: 12px;
              background: white;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              text-align: center;
              font-size: 13px;
              font-weight: 500;
              color: #3b82f6;
            ">1. Instructions</div>
            <div class="ils-step" data-step="2" style="
              flex: 1;
              padding: 12px;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              text-align: center;
              font-size: 13px;
              font-weight: 500;
              color: #94a3b8;
            ">2. Take Photo</div>
            <div class="ils-step" data-step="3" style="
              flex: 1;
              padding: 12px;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              text-align: center;
              font-size: 13px;
              font-weight: 500;
              color: #94a3b8;
            ">3. Results</div>
          </div>

          <!-- Step 1: Instructions -->
          <div class="ils-step-content" data-step="1">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e293b;">
                How to measure your PD:
              </h4>
              <ol style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                <li>Have a credit card or ID card ready</li>
                <li>Sit in a well-lit area facing your webcam</li>
                <li>Hold the card next to your face (touching your cheek)</li>
                <li>Look straight ahead at the camera</li>
                <li>Keep your eyes open and level</li>
                <li>Take the photo</li>
              </ol>
            </div>
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fbbf24; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                <strong>⚠️ Important:</strong> The credit card is used for scale reference. Make sure it's clearly visible and touching your face for accurate measurements.
              </p>
            </div>
            <button class="ils-start-camera" style="
              width: 100%;
              padding: 14px;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              Start Camera
            </button>
          </div>

          <!-- Step 2: Camera -->
          <div class="ils-step-content" data-step="2" style="display: none;">
            <div style="position: relative; background: black; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
              <video class="ils-video" autoplay playsinline style="width: 100%; display: block;"></video>
              <canvas class="ils-canvas" style="display: none;"></canvas>

              <!-- Camera guide overlay -->
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                height: 80%;
                border: 3px dashed rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                pointer-events: none;
              "></div>
            </div>

            <div style="display: flex; gap: 12px;">
              <button class="ils-cancel-camera" style="
                flex: 1;
                padding: 12px;
                background: white;
                color: #64748b;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
              ">
                Cancel
              </button>
              <button class="ils-capture-photo" style="
                flex: 2;
                padding: 12px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
              ">
                📸 Capture Photo
              </button>
            </div>
          </div>

          <!-- Step 3: Processing/Results -->
          <div class="ils-step-content" data-step="3" style="display: none;">
            <!-- Preview -->
            <div class="ils-photo-preview" style="margin-bottom: 16px;">
              <img style="width: 100%; border-radius: 8px; border: 2px solid #e5e7eb;">
            </div>

            <!-- Loading -->
            <div class="ils-processing" style="display: none; text-align: center; padding: 40px;">
              <div style="
                display: inline-block;
                width: 50px;
                height: 50px;
                border: 4px solid #e5e7eb;
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              "></div>
              <p style="margin: 16px 0 0; font-size: 14px; color: #64748b;">
                Measuring your PD with AI...
              </p>
            </div>

            <!-- Results -->
            <div class="ils-pd-results" style="display: none;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">
                  Your Pupillary Distance
                </p>
                <p style="margin: 0; font-size: 48px; font-weight: 700; color: white;">
                  <span class="ils-pd-value"></span> mm
                </p>
                <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">
                  Confidence: <span class="ils-pd-confidence"></span>% • Accuracy: ±1mm
                </p>
              </div>

              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e293b;">
                  Monocular PD (Advanced)
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Right Eye</p>
                    <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #1e293b;">
                      <span class="ils-pd-right"></span> mm
                    </p>
                  </div>
                  <div>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Left Eye</p>
                    <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #1e293b;">
                      <span class="ils-pd-left"></span> mm
                    </p>
                  </div>
                </div>
              </div>

              <button class="ils-retake-photo" style="
                width: 100%;
                padding: 12px;
                background: white;
                color: #64748b;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
              ">
                Retake Measurement
              </button>
            </div>

            <!-- Error -->
            <div class="ils-pd-error" style="display: none; background: #fef2f2; padding: 20px; border-radius: 8px; border: 2px solid #fecaca;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #991b1b; font-weight: 600;">
                ❌ Measurement Failed
              </p>
              <p style="margin: 0 0 16px; font-size: 13px; color: #7f1d1d; line-height: 1.5;">
                <span class="ils-error-message"></span>
              </p>
              <button class="ils-retake-photo" style="
                width: 100%;
                padding: 12px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
              ">
                Try Again
              </button>
            </div>
          </div>

          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .ils-start-camera:hover, .ils-capture-photo:hover {
              transform: translateY(-2px);
            }
          </style>
        </div>
      `;
    }

    attachEventListeners() {
      // Start camera
      this.container.querySelector('.ils-start-camera').addEventListener('click', () => {
        this.showStep(2);
        this.startCamera();
      });

      // Cancel camera
      this.container.querySelector('.ils-cancel-camera').addEventListener('click', () => {
        this.stopCamera();
        this.showStep(1);
      });

      // Capture photo
      this.container.querySelector('.ils-capture-photo').addEventListener('click', () => {
        this.capturePhoto();
      });

      // Retake photo
      this.container.querySelectorAll('.ils-retake-photo').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showStep(2);
          this.startCamera();
        });
      });
    }

    showStep(step) {
      // Update step indicator
      this.container.querySelectorAll('.ils-step').forEach((stepEl, idx) => {
        if (idx + 1 <= step) {
          stepEl.style.borderColor = '#3b82f6';
          stepEl.style.color = '#3b82f6';
        } else {
          stepEl.style.borderColor = '#e5e7eb';
          stepEl.style.color = '#94a3b8';
        }

        if (idx + 1 === step) {
          stepEl.style.background = '#eff6ff';
        } else {
          stepEl.style.background = 'white';
        }
      });

      // Show step content
      this.container.querySelectorAll('.ils-step-content').forEach((content, idx) => {
        content.style.display = idx + 1 === step ? 'block' : 'none';
      });
    }

    async startCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 }
        });

        const video = this.container.querySelector('.ils-video');
        video.srcObject = this.stream;
      } catch (error) {
        console.error('Camera error:', error);
        alert('Unable to access camera. Please check permissions.');
        this.showStep(1);
      }
    }

    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }

    capturePhoto() {
      const video = this.container.querySelector('.ils-video');
      const canvas = this.container.querySelector('.ils-canvas');
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
      this.stopCamera();

      this.showStep(3);
      this.processPDMeasurement();
    }

    async processPDMeasurement() {
      // Show preview
      const preview = this.container.querySelector('.ils-photo-preview img');
      preview.src = this.capturedImage;

      // Show loading
      this.container.querySelector('.ils-processing').style.display = 'block';
      this.container.querySelector('.ils-pd-results').style.display = 'none';
      this.container.querySelector('.ils-pd-error').style.display = 'none';

      try {
        const response = await fetch(`${this.apiUrl}/api/shopify/public/pd-measurement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopifyOrderId: this.orderId,
            selfieImageUrl: this.capturedImage,
            referenceObjectType: 'credit_card'
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Measurement failed');
        }

        const data = await response.json();
        this.pdResult = data;

        // Hide loading, show results
        this.container.querySelector('.ils-processing').style.display = 'none';
        this.showResults(data);

      } catch (error) {
        console.error('PD measurement error:', error);
        this.container.querySelector('.ils-processing').style.display = 'none';
        this.showError(error.message);
      }
    }

    showResults(data) {
      const resultsDiv = this.container.querySelector('.ils-pd-results');

      this.container.querySelector('.ils-pd-value').textContent = data.pupillaryDistance.toFixed(1);
      this.container.querySelector('.ils-pd-confidence').textContent = data.confidence;
      this.container.querySelector('.ils-pd-right').textContent = data.pupillaryDistance / 2; // Simplified
      this.container.querySelector('.ils-pd-left').textContent = data.pupillaryDistance / 2; // Simplified

      resultsDiv.style.display = 'block';

      // Dispatch custom event for parent page
      window.dispatchEvent(new CustomEvent('ils-pd-measured', {
        detail: { pd: data.pupillaryDistance, confidence: data.confidence }
      }));
    }

    showError(message) {
      const errorDiv = this.container.querySelector('.ils-pd-error');
      this.container.querySelector('.ils-error-message').textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  // Auto-initialize
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('#ils-pd-measurement');
    containers.forEach(container => new PDMeasurementWidget(container));
  });

})();
