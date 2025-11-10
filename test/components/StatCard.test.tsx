import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/StatCard';
import { TrendingUp, Users, DollarSign, Package } from 'lucide-react';

describe('StatCard', () => {
  describe('Basic Rendering', () => {
    it('should render title and value', () => {
      render(
        <StatCard
          title="Total Revenue"
          value="$24,500"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$24,500')).toBeInTheDocument();
    });

    it('should render with numeric value', () => {
      render(
        <StatCard
          title="Total Orders"
          value={142}
          icon={Package}
        />
      );

      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
    });

    it('should render with string value', () => {
      render(
        <StatCard
          title="Active Users"
          value="1,234"
          icon={Users}
        />
      );

      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render icon component', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$500"
          icon={DollarSign}
        />
      );

      // Check if icon is rendered (lucide-react icons render as SVG)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('should render positive trend', () => {
      render(
        <StatCard
          title="Monthly Sales"
          value="$15,000"
          icon={TrendingUp}
          trend={{ value: '+12.5%', isPositive: true }}
        />
      );

      const trendElement = screen.getByText('+12.5%');
      expect(trendElement).toBeInTheDocument();
      expect(trendElement).toHaveClass('text-green-600');
    });

    it('should render negative trend', () => {
      render(
        <StatCard
          title="Monthly Sales"
          value="$15,000"
          icon={TrendingUp}
          trend={{ value: '-5.2%', isPositive: false }}
        />
      );

      const trendElement = screen.getByText('-5.2%');
      expect(trendElement).toBeInTheDocument();
      expect(trendElement).toHaveClass('text-red-600');
    });

    it('should not render trend when not provided', () => {
      const { container } = render(
        <StatCard
          title="Monthly Sales"
          value="$15,000"
          icon={TrendingUp}
        />
      );

      // Should only have title and value, no trend
      expect(container.querySelectorAll('p')).toHaveLength(2);
    });

    it('should handle zero trend value', () => {
      render(
        <StatCard
          title="Growth"
          value="100"
          icon={TrendingUp}
          trend={{ value: '0%', isPositive: true }}
        />
      );

      const trendElement = screen.getByText('0%');
      expect(trendElement).toBeInTheDocument();
      expect(trendElement).toHaveClass('text-green-600');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <StatCard
          title="Custom"
          value="100"
          icon={Package}
          className="my-custom-class"
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('my-custom-class');
    });

    it('should apply hover-elevate class by default', () => {
      const { container } = render(
        <StatCard
          title="Default"
          value="100"
          icon={Package}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('hover-elevate');
    });
  });

  describe('Data Test IDs', () => {
    it('should create proper testid from title', () => {
      render(
        <StatCard
          title="Total Revenue"
          value="$24,500"
          icon={DollarSign}
        />
      );

      expect(screen.getByTestId('stat-total-revenue')).toBeInTheDocument();
    });

    it('should handle multi-word titles in testid', () => {
      render(
        <StatCard
          title="Active User Count"
          value="542"
          icon={Users}
        />
      );

      expect(screen.getByTestId('stat-active-user-count')).toBeInTheDocument();
    });

    it('should convert uppercase to lowercase in testid', () => {
      render(
        <StatCard
          title="REVENUE TOTAL"
          value="$1000"
          icon={DollarSign}
        />
      );

      expect(screen.getByTestId('stat-revenue-total')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with semantic HTML structure', () => {
      const { container } = render(
        <StatCard
          title="Accessibility Test"
          value="100"
          icon={Package}
        />
      );

      // Should have proper paragraph elements
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('should have readable text content', () => {
      const { container } = render(
        <StatCard
          title="Orders Today"
          value="45"
          icon={Package}
        />
      );

      expect(container).toHaveTextContent('Orders Today');
      expect(container).toHaveTextContent('45');
    });

    it('should properly distinguish title from value', () => {
      render(
        <StatCard
          title="Total Count"
          value="1000"
          icon={Package}
        />
      );

      const title = screen.getByText('Total Count');
      const value = screen.getByText('1000');

      // Title should have text-muted-foreground class
      expect(title).toHaveClass('text-muted-foreground');

      // Value should have larger font
      expect(value).toHaveClass('text-3xl');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(
        <StatCard
          title="Big Number"
          value="999,999,999"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(
        <StatCard
          title="Empty"
          value=""
          icon={Package}
        />
      );

      // Component should still render even with empty value
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(
        <StatCard
          title="Zero Count"
          value={0}
          icon={Package}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle special characters in value', () => {
      render(
        <StatCard
          title="Currency"
          value="$1,234.56"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should handle trend with special characters', () => {
      render(
        <StatCard
          title="Growth"
          value="100"
          icon={TrendingUp}
          trend={{ value: '+25.5% ↑', isPositive: true }}
        />
      );

      expect(screen.getByText('+25.5% ↑')).toBeInTheDocument();
    });
  });
});
