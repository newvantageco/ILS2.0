import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, type OrderStatus } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  describe('Rendering', () => {
    it('should render pending status correctly', () => {
      render(<StatusBadge status="pending" />);

      const badge = screen.getByTestId('badge-status-pending');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Pending');
    });

    it('should render in_production status correctly', () => {
      render(<StatusBadge status="in_production" />);

      const badge = screen.getByTestId('badge-status-in_production');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('In Production');
    });

    it('should render quality_check status correctly', () => {
      render(<StatusBadge status="quality_check" />);

      const badge = screen.getByTestId('badge-status-quality_check');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Quality Check');
    });

    it('should render shipped status correctly', () => {
      render(<StatusBadge status="shipped" />);

      const badge = screen.getByTestId('badge-status-shipped');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Shipped');
    });

    it('should render completed status correctly', () => {
      render(<StatusBadge status="completed" />);

      const badge = screen.getByTestId('badge-status-completed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Completed');
    });

    it('should render on_hold status correctly', () => {
      render(<StatusBadge status="on_hold" />);

      const badge = screen.getByTestId('badge-status-on_hold');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('On Hold');
    });

    it('should render cancelled status correctly', () => {
      render(<StatusBadge status="cancelled" />);

      const badge = screen.getByTestId('badge-status-cancelled');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Cancelled');
    });
  });

  describe('Styling', () => {
    it('should apply yellow styling for pending status', () => {
      render(<StatusBadge status="pending" />);

      const badge = screen.getByTestId('badge-status-pending');
      expect(badge).toHaveClass('text-yellow-700');
    });

    it('should apply blue styling for in_production status', () => {
      render(<StatusBadge status="in_production" />);

      const badge = screen.getByTestId('badge-status-in_production');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('should apply emerald styling for shipped status', () => {
      render(<StatusBadge status="shipped" />);

      const badge = screen.getByTestId('badge-status-shipped');
      expect(badge).toHaveClass('text-emerald-700');
    });

    it('should apply green styling for completed status', () => {
      render(<StatusBadge status="completed" />);

      const badge = screen.getByTestId('badge-status-completed');
      expect(badge).toHaveClass('text-green-700');
    });

    it('should apply red styling for cancelled status', () => {
      render(<StatusBadge status="cancelled" />);

      const badge = screen.getByTestId('badge-status-cancelled');
      expect(badge).toHaveClass('text-red-700');
    });

    it('should apply custom className when provided', () => {
      const customClass = 'my-custom-class';
      render(<StatusBadge status="pending" className={customClass} />);

      const badge = screen.getByTestId('badge-status-pending');
      expect(badge).toHaveClass(customClass);
    });
  });

  describe('Accessibility', () => {
    it('should render with proper testid attribute', () => {
      const statuses: OrderStatus[] = [
        'pending',
        'in_production',
        'quality_check',
        'shipped',
        'completed',
        'on_hold',
        'cancelled',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId(`badge-status-${status}`);
        expect(badge).toBeInTheDocument();
        unmount();
      });
    });

    it('should render readable text content', () => {
      const { container } = render(<StatusBadge status="in_production" />);
      expect(container).toHaveTextContent('In Production');
      expect(container.textContent).not.toBe('in_production'); // Ensures label is used, not raw status
    });
  });

  describe('Edge Cases', () => {
    it('should handle status with underscores correctly', () => {
      render(<StatusBadge status="in_production" />);
      const badge = screen.getByTestId('badge-status-in_production');
      expect(badge).toHaveTextContent('In Production');
    });

    it('should maintain consistent badge styling across all statuses', () => {
      const statuses: OrderStatus[] = [
        'pending',
        'in_production',
        'quality_check',
        'shipped',
        'completed',
        'on_hold',
        'cancelled',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId(`badge-status-${status}`);

        // All badges should have these base classes
        expect(badge).toHaveClass('rounded-full');
        expect(badge).toHaveClass('px-3');
        expect(badge).toHaveClass('py-1');
        expect(badge).toHaveClass('text-xs');
        expect(badge).toHaveClass('font-semibold');
        expect(badge).toHaveClass('border');

        unmount();
      });
    });
  });
});
