import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeOffQuestion } from '../../src/components/tests/TradeOffQuestion.tsx';
import { TradeOffItem } from '../../src/types.ts';

const mockItems: TradeOffItem[] = [
  { id: 'words', label: 'Слова поддержки', scaleId: 'c_closeness' },
  { id: 'time', label: 'Совместное время', scaleId: 'c_closeness' },
  { id: 'acts', label: 'Помощь и забота', scaleId: 'e_safety' },
  { id: 'touch', label: 'Тактильный контакт', scaleId: 'c_closeness' },
];

describe('TradeOffQuestion Component Stepper & Mobile Touch Tests', () => {
  it('1. Increments item allocation and calls onChange with updated values', () => {
    const handleChange = vi.fn();
    render(
      <TradeOffQuestion
        items={mockItems}
        maxPoints={10}
        allocations={{ words: 2, time: 3 }}
        onChange={handleChange}
      />
    );

    const plusButtons = screen.getAllByRole('button', { name: /увеличить/i });
    expect(plusButtons.length).toBe(4);

    // Click plus for words
    fireEvent.click(plusButtons[0]);

    expect(handleChange).toHaveBeenCalledWith({
      words: 3,
      time: 3,
      acts: 0,
      touch: 0,
    });
  });

  it('2. Decrements item allocation when value > 0', () => {
    const handleChange = vi.fn();
    render(
      <TradeOffQuestion
        items={mockItems}
        maxPoints={10}
        allocations={{ words: 2, time: 3 }}
        onChange={handleChange}
      />
    );

    const minusButtons = screen.getAllByRole('button', { name: /уменьшить/i });
    expect(minusButtons.length).toBe(4);

    // Click minus for words (currentVal = 2)
    fireEvent.click(minusButtons[0]);

    expect(handleChange).toHaveBeenCalledWith({
      words: 1,
      time: 3,
      acts: 0,
      touch: 0,
    });
  });

  it('3. Disables decrement button when item value is 0', () => {
    render(
      <TradeOffQuestion
        items={mockItems}
        maxPoints={10}
        allocations={{ words: 0, time: 3 }}
        onChange={vi.fn()}
      />
    );

    const minusButtons = screen.getAllByRole('button', { name: /уменьшить/i });
    expect(minusButtons[0]).toBeDisabled();
    expect(minusButtons[1]).not.toBeDisabled();
  });

  it('4. Disables increment buttons when total budget is reached (10/10)', () => {
    render(
      <TradeOffQuestion
        items={mockItems}
        maxPoints={10}
        allocations={{ words: 4, time: 3, acts: 2, touch: 1 }}
        onChange={vi.fn()}
      />
    );

    const plusButtons = screen.getAllByRole('button', { name: /увеличить/i });
    plusButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    expect(screen.getByText(/✓ Готово \(0\)/i)).toBeInTheDocument();
  });
});
