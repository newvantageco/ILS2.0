/**
 * ILS 2.0 Shopify AI Lens Recommendation Widget
 *
 * Embeddable widget for Shopify storefronts to provide AI-powered lens recommendations
 *
 * Installation:
 * 1. Add to your Shopify product page:
 *    <div id="ils-lens-recommendations" data-store-id="YOUR_STORE_ID" data-product-id="{{ product.id }}"></div>
 *    <script src="https://your-ils-domain.com/shopify-widgets/lens-recommendation-widget.js"></script>
 *
 * 2. Configure via data attributes:
 *    data-store-id="..." - Required: Your ILS Shopify store ID
 *    data-product-id="..." - Required: Shopify product ID
 *    data-customer-email="..." - Optional: Customer email for personalized recommendations
 */

(function() {
  'use strict';

  // Widget configuration
  const CONFIG = {
    apiBaseUrl: window.ILS_API_URL || 'https://api.ils2.com',
  };

  /**
   * Initialize lens recommendation widget
   */
  function initLensRecommendationWidget() {
    const containers = document.querySelectorAll('#ils-lens-recommendations');

    containers.forEach(container => {
      const storeId = container.getAttribute('data-store-id');
      const productId = container.getAttribute('data-product-id');
      const customerEmail = container.getAttribute('data-customer-email');

      if (!storeId || !productId) {
        console.error('ILS Lens Recommendation Widget: data-store-id and data-product-id are required');
        return;
      }

      renderWidget(container, { storeId, productId, customerEmail });
      loadRecommendations(container, { storeId, productId, customerEmail });
    });
  }

  /**
   * Render widget HTML
   */
  function renderWidget(container, config) {
    container.innerHTML = `
      <div class="ils-lens-recommendation-widget">
        <div class="ils-widget-header">
          <div class="ils-header-content">
            <h3>AI-Powered Lens Recommendations</h3>
            <div class="ils-ai-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              AI Assistant
            </div>
          </div>
          <p class="ils-widget-subtitle">
            Get personalized lens recommendations based on your lifestyle and needs
          </p>
        </div>

        <div class="ils-recommendation-loading" id="ils-recommendation-loading">
          <div class="ils-spinner"></div>
          <p>Analyzing product and generating recommendations...</p>
        </div>

        <div class="ils-recommendation-content" id="ils-recommendation-content" style="display: none;">
          <!-- Lifestyle questionnaire -->
          <div class="ils-questionnaire" id="ils-questionnaire">
            <h4>Tell us about your needs</h4>
            <p class="ils-questionnaire-subtitle">Answer a few questions for personalized recommendations</p>

            <div class="ils-question">
              <label>What will you primarily use these glasses for?</label>
              <select id="ils-usage" class="ils-select">
                <option value="">Select usage...</option>
                <option value="daily">Daily wear / All-purpose</option>
                <option value="computer">Computer / Screen work</option>
                <option value="reading">Reading / Close-up work</option>
                <option value="driving">Driving</option>
                <option value="sports">Sports / Outdoor activities</option>
                <option value="office">Office work</option>
              </select>
            </div>

            <div class="ils-question">
              <label>How much time do you spend on digital devices daily?</label>
              <select id="ils-screen-time" class="ils-select">
                <option value="">Select time...</option>
                <option value="minimal">Less than 2 hours</option>
                <option value="moderate">2-4 hours</option>
                <option value="heavy">4-8 hours</option>
                <option value="extreme">More than 8 hours</option>
              </select>
            </div>

            <div class="ils-question">
              <label>Do you drive frequently at night?</label>
              <select id="ils-night-driving" class="ils-select">
                <option value="">Select...</option>
                <option value="never">Never / Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div class="ils-question">
              <label>Do you spend time outdoors?</label>
              <select id="ils-outdoor-time" class="ils-select">
                <option value="">Select...</option>
                <option value="minimal">Mostly indoors</option>
                <option value="moderate">Some outdoor time</option>
                <option value="frequent">Frequently outdoors</option>
                <option value="constant">Mostly outdoors</option>
              </select>
            </div>

            <button class="ils-btn ils-btn-primary" id="ils-get-recommendations">
              Get AI Recommendations
            </button>
          </div>

          <!-- Recommendations display -->
          <div class="ils-recommendations-display" id="ils-recommendations-display" style="display: none;">
            <div class="ils-recommendations-header">
              <h4>Your Personalized Recommendations</h4>
              <button class="ils-btn-link" id="ils-retake-quiz">Retake Quiz</button>
            </div>

            <div id="ils-recommendations-list"></div>

            <div class="ils-recommendation-cta">
              <p class="ils-confidence-note" id="ils-confidence-note"></p>
              <button class="ils-btn ils-btn-primary" id="ils-add-recommendations">
                Add Recommended Options to Cart
              </button>
            </div>
          </div>
        </div>

        <div class="ils-recommendation-error" id="ils-recommendation-error" style="display: none;">
          <div class="ils-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h4>Unable to Load Recommendations</h4>
          <p id="ils-error-text"></p>
          <button class="ils-btn ils-btn-secondary" id="ils-retry-recommendations">
            Try Again
          </button>
        </div>

        <div class="ils-widget-footer">
          <p class="ils-ai-disclaimer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            AI recommendations are suggestions based on typical needs. Consult with your optician for professional advice.
          </p>
        </div>
      </div>
    `;

    attachEventListeners(container, config);
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners(container, config) {
    // Get recommendations button
    const getRecommendationsBtn = container.querySelector('#ils-get-recommendations');
    if (getRecommendationsBtn) {
      getRecommendationsBtn.addEventListener('click', () => {
        const answers = {
          usage: container.querySelector('#ils-usage').value,
          screenTime: container.querySelector('#ils-screen-time').value,
          nightDriving: container.querySelector('#ils-night-driving').value,
          outdoorTime: container.querySelector('#ils-outdoor-time').value,
        };

        if (!answers.usage || !answers.screenTime || !answers.nightDriving || !answers.outdoorTime) {
          alert('Please answer all questions');
          return;
        }

        getAIRecommendations(container, config, answers);
      });
    }

    // Retake quiz button
    const retakeQuizBtn = container.querySelector('#ils-retake-quiz');
    if (retakeQuizBtn) {
      retakeQuizBtn.addEventListener('click', () => {
        showQuestionnaire(container);
      });
    }

    // Add to cart button
    const addToCartBtn = container.querySelector('#ils-add-recommendations');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        addRecommendationsToCart(container);
      });
    }

    // Retry button
    const retryBtn = container.querySelector('#ils-retry-recommendations');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        loadRecommendations(container, config);
      });
    }
  }

  /**
   * Load initial recommendations
   */
  async function loadRecommendations(container, config) {
    showLoading(container);

    try {
      // Just show the questionnaire initially
      setTimeout(() => {
        hideLoading(container);
        showQuestionnaire(container);
      }, 500);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      showError(container, error.message || 'Failed to load recommendations');
    }
  }

  /**
   * Get AI recommendations based on answers
   */
  async function getAIRecommendations(container, config, answers) {
    showLoading(container);

    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/api/ai/lens-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: config.storeId,
          productId: config.productId,
          customerEmail: config.customerEmail,
          lifestyle: answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const recommendations = await response.json();
      displayRecommendations(container, recommendations);
      triggerCustomEvent('recommendationsReceived', recommendations);

    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      showError(container, error.message || 'Failed to generate recommendations');
    }
  }

  /**
   * Display recommendations
   */
  function displayRecommendations(container, recommendations) {
    hideLoading(container);
    container.querySelector('#ils-questionnaire').style.display = 'none';
    container.querySelector('#ils-recommendations-display').style.display = 'block';

    const listContainer = container.querySelector('#ils-recommendations-list');
    listContainer.innerHTML = '';

    // Display lens material recommendation
    if (recommendations.lensMaterial) {
      listContainer.innerHTML += renderRecommendationCard({
        title: 'Lens Material',
        recommendation: recommendations.lensMaterial.name,
        description: recommendations.lensMaterial.description,
        benefits: recommendations.lensMaterial.benefits,
        priority: 'high',
      });
    }

    // Display coating recommendations
    if (recommendations.coatings && recommendations.coatings.length > 0) {
      recommendations.coatings.forEach(coating => {
        listContainer.innerHTML += renderRecommendationCard({
          title: 'Lens Coating',
          recommendation: coating.name,
          description: coating.description,
          benefits: coating.benefits,
          priority: coating.priority || 'medium',
        });
      });
    }

    // Display additional features
    if (recommendations.additionalFeatures && recommendations.additionalFeatures.length > 0) {
      recommendations.additionalFeatures.forEach(feature => {
        listContainer.innerHTML += renderRecommendationCard({
          title: 'Additional Feature',
          recommendation: feature.name,
          description: feature.description,
          benefits: feature.benefits,
          priority: feature.priority || 'low',
        });
      });
    }

    // Display confidence note
    if (recommendations.confidence) {
      const confidenceNote = container.querySelector('#ils-confidence-note');
      const confidencePercent = Math.round(recommendations.confidence * 100);
      confidenceNote.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        ${confidencePercent}% confidence match for your lifestyle
      `;
    }

    // Store recommendations in widget state
    container._recommendations = recommendations;
  }

  /**
   * Render recommendation card
   */
  function renderRecommendationCard(rec) {
    const priorityClass = `ils-priority-${rec.priority}`;
    const priorityLabel = rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1);

    return `
      <div class="ils-recommendation-card ${priorityClass}">
        <div class="ils-recommendation-header">
          <div>
            <span class="ils-recommendation-category">${rec.title}</span>
            <h5 class="ils-recommendation-name">${rec.recommendation}</h5>
          </div>
          <span class="ils-priority-badge">${priorityLabel} Priority</span>
        </div>
        <p class="ils-recommendation-description">${rec.description}</p>
        ${rec.benefits && rec.benefits.length > 0 ? `
          <div class="ils-benefits">
            <strong>Benefits:</strong>
            <ul>
              ${rec.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Add recommendations to cart
   */
  function addRecommendationsToCart(container) {
    const recommendations = container._recommendations;

    if (!recommendations) {
      alert('No recommendations available');
      return;
    }

    // Trigger custom event for Shopify theme to handle
    triggerCustomEvent('addRecommendationsToCart', recommendations);

    // Shopify themes will need to listen for this event and handle adding to cart
    // Example handler in theme:
    // document.addEventListener('ils:addRecommendationsToCart', (e) => {
    //   const recommendations = e.detail;
    //   // Add recommended products/variants to cart
    // });

    alert('Recommendations will be added to your cart. (Shopify theme integration required)');
  }

  /**
   * Show loading state
   */
  function showLoading(container) {
    container.querySelector('#ils-recommendation-loading').style.display = 'block';
    container.querySelector('#ils-recommendation-content').style.display = 'none';
    container.querySelector('#ils-recommendation-error').style.display = 'none';
  }

  /**
   * Hide loading state
   */
  function hideLoading(container) {
    container.querySelector('#ils-recommendation-loading').style.display = 'none';
    container.querySelector('#ils-recommendation-content').style.display = 'block';
  }

  /**
   * Show questionnaire
   */
  function showQuestionnaire(container) {
    container.querySelector('#ils-questionnaire').style.display = 'block';
    container.querySelector('#ils-recommendations-display').style.display = 'none';
  }

  /**
   * Show error state
   */
  function showError(container, message) {
    container.querySelector('#ils-recommendation-loading').style.display = 'none';
    container.querySelector('#ils-recommendation-content').style.display = 'none';
    container.querySelector('#ils-recommendation-error').style.display = 'block';
    container.querySelector('#ils-error-text').textContent = message;
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
    document.addEventListener('DOMContentLoaded', initLensRecommendationWidget);
  } else {
    initLensRecommendationWidget();
  }

  // Expose public API
  window.ILSLensRecommendationWidget = {
    init: initLensRecommendationWidget,
  };

})();
