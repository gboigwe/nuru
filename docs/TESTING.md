# Testing Guide for Nuru VoicePay

## Overview

This document provides comprehensive information about the testing infrastructure for the Nuru VoicePay application.

## Test Coverage Goals

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Smart Contracts | 95%+ | ✅ Implemented |
| Payment Services | 90%+ | ✅ Implemented |
| Voice Processing | 85%+ | ✅ Implemented |
| React Components | 80%+ | 🚧 In Progress |
| Utilities | 90%+ | 🚧 In Progress |

## Running Tests

### Smart Contract Tests

```bash
# Run all contract tests
cd packages/hardhat
yarn test

# Run with gas reporting
yarn test:gas

# Generate coverage report
yarn test:coverage
```

### Frontend Unit Tests

```bash
# Run all frontend tests
cd packages/nextjs
yarn test

# Run tests in watch mode
yarn test --watch

# Run with coverage
yarn test:coverage

# Run tests with UI
yarn test:ui
```

### Run All Tests

```bash
# From project root
yarn test
```

## Test Structure

### Smart Contract Tests

Located in `packages/hardhat/test/`

- **VoiceRemittance.test.ts**: Core contract functionality
  - Deployment tests
  - USDC payment initiation
  - Payment validation
  - ETH payments with ENS
  - Payment completion and cancellation
  - Admin functions
  - Security features (rate limiting, daily limits)

- **MockERC20.sol**: Mock USDC token for testing

### Frontend Unit Tests

Located in `packages/nextjs/services/*/tests/`

- **VoiceCommandProcessor.test.ts**: Voice command parsing
  - Payment intent extraction
  - Voice recognition error correction
  - Command validation
  - Multi-language support

- **USDCPaymentHandler.test.ts**: USDC payment execution
  - Balance checking
  - Approval handling
  - Payment execution
  - Error handling

- **ENSService.test.ts**: ENS resolution
  - Forward resolution
  - Reverse resolution
  - Validation
  - Voice command integration

- **CurrencyConverter.test.ts**: Currency conversion
  - GHS to USDC conversion
  - NGN to USDC conversion
  - Exchange rate handling
  - Formatting

## Writing Tests

### Smart Contract Test Example

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VoiceRemittance", () => {
  let contract: VoiceRemittance;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("VoiceRemittance");
    contract = await Factory.deploy(usdcAddress);
  });

  it("should initiate USDC payment", async () => {
    const tx = await contract.initiateUSDCPayment(
      recipient,
      amount,
      voiceHash,
      metadata
    );
    
    await expect(tx)
      .to.emit(contract, "PaymentInitiated")
      .withArgs(1, owner.address, "", amount, "USDC", voiceHash);
  });
});
```

### Frontend Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('VoiceCommandProcessor', () => {
  it('should parse payment command', async () => {
    const result = await processor.extractPaymentIntent(
      'send 50 cedis to mama.family.eth'
    );

    expect(result?.action).toBe('send_money');
    expect(result?.amount).toBe('50');
    expect(result?.recipient).toBe('mama.family.eth');
  });
});
```

## CI/CD Integration

### GitHub Actions Workflows

1. **test.yml**: Runs on every push and PR
   - Smart contract tests
   - Frontend unit tests
   - Linting and type checking

2. **coverage.yml**: Generates coverage reports
   - Uploads to Codecov
   - Comments on PRs with coverage changes

### Coverage Requirements

- Pull requests must maintain or improve coverage
- Minimum 80% overall coverage required
- Critical paths (payments, voice processing) require 90%+

## Test Categories

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Fast execution (< 1 second per test)

### Integration Tests
- Test interaction between multiple components
- Use real implementations where possible
- Moderate execution time (1-5 seconds per test)

### Contract Tests
- Test smart contract functionality
- Use Hardhat network for fast execution
- Test edge cases and security features

## Best Practices

### 1. Test Naming
```typescript
// Good
it('should reject payments with insufficient balance')

// Bad
it('test payment')
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should transfer USDC to recipient', async () => {
  // Arrange
  await usdcMock.mint(user1.address, amount);
  await usdcMock.connect(user1).approve(contract.address, amount);
  
  // Act
  await contract.initiateUSDCPayment(user2.address, amount, hash, metadata);
  
  // Assert
  const balance = await usdcMock.balanceOf(user2.address);
  expect(balance).to.equal(expectedAmount);
});
```

### 3. Test Edge Cases
- Zero amounts
- Maximum amounts
- Invalid addresses
- Insufficient balances
- Rate limiting
- Reentrancy attacks

### 4. Mock External Services
```typescript
vi.mock('../OpenAIService', () => ({
  openAIService: {
    extractPaymentIntent: vi.fn(),
  },
}));
```

## Debugging Tests

### Hardhat Tests
```bash
# Run specific test file
yarn test test/VoiceRemittance.test.ts

# Run specific test
yarn test --grep "should initiate USDC payment"

# Enable console logs
yarn test --logs
```

### Vitest Tests
```bash
# Run specific test file
yarn test VoiceCommandProcessor.test.ts

# Run in watch mode
yarn test --watch

# Debug in VS Code
# Add breakpoint and use "Debug Test" in test file
```

## Coverage Reports

### Viewing Coverage

```bash
# Generate HTML coverage report
cd packages/hardhat
yarn test:coverage

# Open in browser
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:
```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

## Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout in test file
```typescript
it('should complete payment', async () => {
  // ...
}).timeout(10000); // 10 seconds
```

### Issue: Mock not working
**Solution**: Ensure mock is defined before import
```typescript
vi.mock('./module', () => ({
  // mock implementation
}));

import { functionToTest } from './module';
```

### Issue: Contract deployment fails
**Solution**: Check USDC mock is deployed first
```typescript
beforeEach(async () => {
  usdcMock = await MockERC20.deploy("USDC", "USDC", 6);
  await usdcMock.waitForDeployment();
  
  contract = await VoiceRemittance.deploy(await usdcMock.getAddress());
});
```

## Resources

- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

## Support

For testing questions or issues:
- Open an issue on GitHub
- Check existing test files for examples
- Review CI/CD logs for failures
