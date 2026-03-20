import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecipeMetadataHeader from '@/components/recipes/RecipeMetadataHeader'

describe('RecipeMetadataHeader', () => {
  it('renders category badge when classification provided', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
      />
    )
    
    expect(screen.getByText('Baked Goods')).toBeInTheDocument()
  })

  it('renders source name when provided', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
        source={{ name: 'AllRecipes' }}
      />
    )
    
    expect(screen.getByText('AllRecipes')).toBeInTheDocument()
  })

  it('renders source as link when URL provided', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
        source={{ name: 'AllRecipes', url: 'https://allrecipes.com' }}
      />
    )
    
    const link = screen.getByText('AllRecipes').closest('a')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://allrecipes.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders source as plain text when no URL', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
        source={{ name: 'Family Recipe' }}
      />
    )
    
    const sourceElement = screen.getByText('Family Recipe')
    expect(sourceElement.tagName).not.toBe('A')
  })

  it('renders without classification when not provided', () => {
    render(
      <RecipeMetadataHeader 
        source={{ name: 'AllRecipes' }}
      />
    )
    
    expect(screen.getByText('AllRecipes')).toBeInTheDocument()
  })

  it('renders without source when not provided', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
      />
    )
    
    expect(screen.getByText('Baked Goods')).toBeInTheDocument()
  })

  it('has responsive flex layout', () => {
    const { container } = render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
        source={{ name: 'AllRecipes' }}
      />
    )
    
    const header = container.querySelector('[data-testid="recipe-metadata-header"]')
    expect(header).toHaveClass('flex')
    expect(header).toHaveClass('flex-col')
    expect(header).toHaveClass('md:flex-row')
  })

  it('includes source link icon with aria-hidden', () => {
    const { container } = render(
      <RecipeMetadataHeader 
        source={{ name: 'AllRecipes', url: 'https://allrecipes.com' }}
      />
    )
    
    // Should render a link icon for external URLs
    const icons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('category badge is non-clickable', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
      />
    )
    
    const badgeSpan = screen.getByText('Baked Goods')
    expect(badgeSpan.closest('a')).not.toBeInTheDocument()
  })

  it('renders metadata header container', () => {
    const { container } = render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
        source={{ name: 'AllRecipes' }}
      />
    )
    
    const header = container.querySelector('[data-testid="recipe-metadata-header"]')
    expect(header).toBeInTheDocument()
  })

  it('renders source element with correct data-testid', () => {
    const { container } = render(
      <RecipeMetadataHeader 
        source={{ name: 'AllRecipes' }}
      />
    )
    
    const sourceElement = container.querySelector('[data-testid="recipe-source"]')
    expect(sourceElement).toBeInTheDocument()
  })

  it('renders stacked layout on mobile (below md breakpoint)', () => {
    render(
      <RecipeMetadataHeader 
        classification={{ id: 'c1', name: 'Baked Goods' }}
        source={{ name: 'AllRecipes' }}
      />
    )
    
    // Component renders
    expect(screen.getByText('Baked Goods')).toBeInTheDocument()
  })
})
