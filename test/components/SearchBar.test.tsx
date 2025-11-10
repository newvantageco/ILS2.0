import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search orders...');
    });

    it('should render with custom placeholder', () => {
      render(<SearchBar placeholder="Search patients..." />);

      const input = screen.getByTestId('input-search');
      expect(input).toHaveAttribute('placeholder', 'Search patients...');
    });

    it('should render with search icon', () => {
      const { container } = render(<SearchBar />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render with search input type', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should apply custom className', () => {
      const { container } = render(<SearchBar className="my-custom-class" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('my-custom-class');
    });
  });

  describe('Controlled Input', () => {
    it('should display initial value', () => {
      render(<SearchBar value="test query" />);

      const input = screen.getByTestId('input-search') as HTMLInputElement;
      expect(input.value).toBe('test query');
    });

    it('should call onChange when user types', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      await userEvent.type(input, 'a');

      expect(handleChange).toHaveBeenCalledWith('a');
    });

    it('should call onChange with correct value for each keystroke', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');

      // Type 'a'
      await user.clear(input);
      fireEvent.change(input, { target: { value: 'a' } });
      expect(handleChange).toHaveBeenLastCalledWith('a');

      // Type 'ab'
      fireEvent.change(input, { target: { value: 'ab' } });
      expect(handleChange).toHaveBeenLastCalledWith('ab');

      // Type 'abc'
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(handleChange).toHaveBeenLastCalledWith('abc');
    });

    it('should update display when value prop changes', () => {
      const { rerender } = render(<SearchBar value="initial" />);

      let input = screen.getByTestId('input-search') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(<SearchBar value="updated" />);

      input = screen.getByTestId('input-search') as HTMLInputElement;
      expect(input.value).toBe('updated');
    });

    it('should clear value when empty string is provided', () => {
      const { rerender } = render(<SearchBar value="some text" />);

      let input = screen.getByTestId('input-search') as HTMLInputElement;
      expect(input.value).toBe('some text');

      rerender(<SearchBar value="" />);

      input = screen.getByTestId('input-search') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('User Interactions', () => {
    it('should handle typing with keyboard', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'search term' } });

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledWith('search term');
    });

    it('should handle paste events', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'pasted text' } });

      expect(handleChange).toHaveBeenCalledWith('pasted text');
    });

    it('should handle backspace', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="test" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      await userEvent.type(input, '{Backspace}');

      expect(handleChange).toHaveBeenCalledWith('tes');
    });

    it('should handle clearing input with browser clear button', () => {
      const handleChange = vi.fn();
      render(<SearchBar value="some text" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: '' } });

      expect(handleChange).toHaveBeenCalledWith('');
    });

    it('should allow focus on input', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search');
      input.focus();

      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should work without onChange handler', () => {
      render(<SearchBar value="test" />);

      const input = screen.getByTestId('input-search');

      // Should not throw error when typing
      expect(() => {
        fireEvent.change(input, { target: { value: 'new value' } });
      }).not.toThrow();
    });

    it('should handle undefined value', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle special characters', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      const specialChars = '!@#$%^&*()';
      fireEvent.change(input, { target: { value: specialChars } });

      expect(handleChange).toHaveBeenCalledWith(specialChars);
    });

    it('should handle unicode characters', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      const unicode = '你好世界';
      await userEvent.type(input, unicode);

      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle numbers', async () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: '12345' } });

      expect(handleChange).toHaveBeenCalledWith('12345');
    });

    it('should handle long text input', async () => {
      const handleChange = vi.fn();
      const longText = 'a'.repeat(500);
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByTestId('input-search');
      await userEvent.type(input, longText);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should have left padding for icon', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search');
      expect(input).toHaveClass('pl-9');
    });

    it('should position icon correctly', () => {
      const { container } = render(<SearchBar />);

      const iconWrapper = container.querySelector('.absolute');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveClass('left-3');
    });

    it('should apply flex-1 to wrapper by default', () => {
      const { container } = render(<SearchBar />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex-1');
      expect(wrapper).toHaveClass('relative');
    });
  });

  describe('Accessibility', () => {
    it('should have proper input type for search', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should be keyboard accessible', () => {
      render(<SearchBar />);

      const input = screen.getByTestId('input-search');

      // Should be focusable via keyboard
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should have readable placeholder text', () => {
      render(<SearchBar placeholder="Search for products" />);

      const input = screen.getByPlaceholderText('Search for products');
      expect(input).toBeInTheDocument();
    });

    it('should have testid for automated testing', () => {
      render(<SearchBar />);

      expect(screen.getByTestId('input-search')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work in a controlled component pattern', () => {
      const TestComponent = () => {
        const [searchTerm, setSearchTerm] = React.useState('');

        return (
          <div>
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <div data-testid="search-result">{searchTerm}</div>
          </div>
        );
      };

      render(<TestComponent />);

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByTestId('search-result')).toHaveTextContent('test');
    });
  });
});

// Import React for the integration test
import React from 'react';
