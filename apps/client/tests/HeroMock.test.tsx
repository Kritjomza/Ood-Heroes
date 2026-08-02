import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroMock } from '../src/ui/persistent/HeroMock';

describe('HeroMock', () => {
  it('replaces an image that fails to load with a themed fallback', () => {
    const { container } = render(<HeroMock assetId="hero.grilled_chicken.portrait" />);
    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByRole('img', { name: /artwork unavailable/u })).toBeInTheDocument();
    expect(screen.getByText('Oddity incoming')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
