/**
 * Mock Data Generators
 * Helper functions for generating realistic test data
 */

/**
 * Generate mock Shopify order
 */
export function createMockShopifyOrder(overrides?: Partial<any>) {
  return {
    id: 123456789,
    order_number: 1001,
    email: 'customer@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_price: '299.99',
    subtotal_price: '249.99',
    total_tax: '50.00',
    currency: 'GBP',
    financial_status: 'paid',
    fulfillment_status: 'unfulfilled',
    customer: {
      id: 987654321,
      email: 'customer@example.com',
      first_name: 'John',
      last_name: 'Smith',
      phone: '07123456789',
    },
    shipping_address: {
      first_name: 'John',
      last_name: 'Smith',
      address1: '123 High Street',
      address2: '',
      city: 'London',
      province: '',
      country: 'United Kingdom',
      zip: 'SW1A 1AA',
      phone: '07123456789',
    },
    line_items: [
      {
        id: 111222333,
        product_id: 444555666,
        title: 'Progressive Lenses - Premium',
        variant_id: 777888999,
        variant_title: 'Standard',
        quantity: 1,
        price: '249.99',
        sku: 'PROG-PREM-STD',
        requires_shipping: true,
      },
    ],
    note_attributes: [],
    ...overrides,
  };
}

/**
 * Generate mock prescription data
 */
export function createMockPrescription(overrides?: Partial<any>) {
  return {
    odSphere: '+1.50',
    odCylinder: '-0.75',
    odAxis: '090',
    odAdd: '+2.00',
    osSphere: '+1.25',
    osCylinder: '-0.50',
    osAxis: '095',
    osAdd: '+2.00',
    pd: '64',
    prescriptionType: 'spectacles',
    ...overrides,
  };
}

/**
 * Generate mock patient data
 */
export function createMockPatient(overrides?: Partial<any>) {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    email: `patient-${Date.now()}@example.com`,
    phone: '07987654321',
    dateOfBirth: new Date('1985-06-15'),
    nhsNumber: '9876543210',
    address: {
      line1: '789 Patient Avenue',
      line2: 'Flat 4',
      city: 'Manchester',
      postcode: 'M1 1AA',
      country: 'United Kingdom',
    },
    ...overrides,
  };
}

/**
 * Generate mock AI query
 */
export function createMockAIQuery(overrides?: Partial<any>) {
  return {
    message: 'What lenses would you recommend for a patient with +2.00 ADD?',
    userId: 'test-user-123',
    companyId: 'test-company-123',
    context: {},
    ...overrides,
  };
}

/**
 * Generate mock OpenAI response
 */
export function createMockOpenAIResponse(content: string) {
  return {
    id: 'chatcmpl-123456',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 100,
      total_tokens: 150,
    },
  };
}

/**
 * Generate mock Anthropic response
 */
export function createMockAnthropicResponse(content: string) {
  return {
    id: 'msg_123456',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: content,
      },
    ],
    model: 'claude-3-5-sonnet-20241022',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 50,
      output_tokens: 100,
    },
  };
}

/**
 * Generate mock order data
 */
export function createMockOrder(overrides?: Partial<any>) {
  return {
    orderNumber: `ORD-${Date.now()}`,
    status: 'pending',
    lensType: 'progressive',
    lensMaterial: 'polycarbonate',
    coating: 'premium_ar',
    frameType: 'full_frame',
    totalPrice: '350.00',
    ...overrides,
  };
}

/**
 * Generate mock invoice data
 */
export function createMockInvoiceData(overrides?: Partial<any>) {
  return {
    invoiceNumber: `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    companyName: 'Test Optical Practice',
    companyAddress: '123 Test Street, London, SW1A 1AA',
    companyPhone: '020 1234 5678',
    companyEmail: 'info@testoptical.com',
    customerName: 'John Smith',
    customerAddress: '456 Customer Road, London, E1 6AN',
    customerEmail: 'john.smith@example.com',
    items: [
      {
        description: 'Progressive Lenses - Premium',
        quantity: 1,
        unitPrice: 249.99,
        total: 249.99,
      },
      {
        description: 'Anti-Reflective Coating',
        quantity: 1,
        unitPrice: 50.00,
        total: 50.00,
      },
    ],
    subtotal: 299.99,
    tax: 60.00,
    taxRate: 0.20,
    total: 359.99,
    notes: 'Thank you for your business',
    paymentTerms: 'Payment due within 30 days',
    ...overrides,
  };
}

/**
 * Generate mock user for authentication tests
 */
export function createMockAuthUser(overrides?: Partial<any>) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'ecp',
    enhancedRole: 'optometrist',
    companyId: 'test-company-123',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    ...overrides,
  };
}

/**
 * Generate mock request object
 */
export function createMockRequest(overrides?: Partial<any>) {
  return {
    user: createMockAuthUser(),
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

/**
 * Generate mock response object
 */
export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}
