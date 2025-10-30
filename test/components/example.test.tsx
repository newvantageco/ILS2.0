import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * Frontend Component Test Setup
 * 
 * This file demonstrates how to test React components with React Testing Library
 */

// Mock component for demonstration (replace with actual components)
function LoginForm({ onSubmit }: { onSubmit: (email: string, password: string) => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email.includes('@')) {
      setEmailError('Invalid email address');
      return;
    }
    
    setEmailError('');
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        aria-label="Email"
      />
      {emailError && <span role="alert">{emailError}</span>}
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        aria-label="Password"
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}

describe('LoginForm Component', () => {
  it('should render email and password inputs', () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('should show error for invalid email', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Type invalid email
    await user.type(emailInput, 'not-an-email');
    await user.click(submitButton);
    
    // Check for error message
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with valid credentials', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    const user = userEvent.setup();
    
    // Type valid credentials
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    // Verify submission
    expect(mockSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should clear error when typing valid email', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText('Email');
    
    // First, trigger error
    await user.type(emailInput, 'invalid');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Then fix it
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

/**
 * Example test for a data table component
 */
function OrdersTable({ orders }: { orders: Array<{ id: string; status: string; patient: string }> }) {
  if (orders.length === 0) {
    return <div>No orders found</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Patient</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.patient}</td>
            <td>{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

describe('OrdersTable Component', () => {
  it('should render orders in table', () => {
    const orders = [
      { id: 'ORD-001', patient: 'John Doe', status: 'pending' },
      { id: 'ORD-002', patient: 'Jane Smith', status: 'in_production' },
    ];
    
    render(<OrdersTable orders={orders} />);
    
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
  });

  it('should show empty state when no orders', () => {
    render(<OrdersTable orders={[]} />);
    
    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should render correct number of rows', () => {
    const orders = [
      { id: 'ORD-001', patient: 'John Doe', status: 'pending' },
      { id: 'ORD-002', patient: 'Jane Smith', status: 'in_production' },
      { id: 'ORD-003', patient: 'Bob Wilson', status: 'completed' },
    ];
    
    render(<OrdersTable orders={orders} />);
    
    const rows = screen.getAllByRole('row');
    // +1 for header row
    expect(rows).toHaveLength(orders.length + 1);
  });
});
