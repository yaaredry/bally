import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkillBadge from '../components/SkillBadge';

describe('SkillBadge', () => {
  test('renders Beach Volleyball level 3', () => {
    render(<SkillBadge level="3" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('renders Footvolley League level', () => {
    render(<SkillBadge level="League" />);
    expect(screen.getByText('League')).toBeInTheDocument();
  });

  test('renders All welcome', () => {
    render(<SkillBadge level="All welcome" />);
    expect(screen.getByText('All welcome')).toBeInTheDocument();
  });

  test('renders null gracefully for unknown level', () => {
    const { container } = render(<SkillBadge level="Unknown" />);
    // Should still render without crashing
    expect(container).toBeDefined();
  });

  test('all BV levels render without error', () => {
    ['1','2','3','4','5','6','7'].forEach(level => {
      const { unmount } = render(<SkillBadge level={level} />);
      expect(screen.getByText(level)).toBeInTheDocument();
      unmount();
    });
  });

  test('all Footvolley levels render without error', () => {
    ['E','D','C','B','A','League'].forEach(level => {
      const { unmount } = render(<SkillBadge level={level} />);
      expect(screen.getByText(level)).toBeInTheDocument();
      unmount();
    });
  });
});
