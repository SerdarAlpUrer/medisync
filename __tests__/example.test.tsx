import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Basic Setup', () => {
    it('should pass this simple test', () => {
        expect(1 + 1).toBe(2)
    })

    it('should be able to render a component', () => {
        render(<div data-testid="test">Hello</div>)
        expect(screen.getByTestId('test')).toBeDefined()
    })
})
