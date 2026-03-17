# Testing Guide

This directory contains Vitest test files for the Vue SAFT project.

## Quick Start

### Running Tests

**Watch mode** (re-runs on file changes):
```bash
npm run test
```

**Single run** (for CI/CD pipelines):
```bash
npm run test:run
```

**Interactive UI** (opens browser-based test dashboard):
```bash
vitest --ui
```

## Writing Tests

Place test files in this directory with naming convention:
- `*.spec.js` - recommended
- `*.test.js` - also supported

### Basic Test Structure

```javascript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/utils/myFunction.js'

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction(2, 3)).toBe(5)
  })
})
```

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically runs tests:

```yaml
- name: Run Vitest
  run: npm run test:run
```

Tests must pass before building and deploying the application.
For more information, see [Vitest Documentation](https://vitest.dev/)
