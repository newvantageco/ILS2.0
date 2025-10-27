# Testing

The project includes comprehensive test coverage for both backend services and frontend components. The test suite is built using Jest and includes unit tests, integration tests, and end-to-end tests.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Types

### Unit Tests
Unit tests cover individual components and services:
- Equipment Discovery Service
- PDF Generation Service
- Notification Service
- React Components

### Integration Tests
Integration tests verify the interaction between different parts of the system:
- API Endpoints
- Database Operations
- WebSocket Communication

### End-to-End Tests
End-to-end tests simulate real user interactions:
- Order Creation Flow
- User Authentication
- File Upload and Processing

## Test Coverage

We maintain high test coverage across critical parts of the application:
- Core Services: >90% coverage
- API Endpoints: >85% coverage
- React Components: >80% coverage

## Continuous Integration

Tests are automatically run in GitHub Actions:
- On every push to main branch
- On pull request creation/update
- Daily scheduled runs

Coverage reports are automatically generated and uploaded as artifacts.