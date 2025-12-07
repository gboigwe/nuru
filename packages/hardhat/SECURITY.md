# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

### Implemented Protections

1. **Timelock for Admin Functions**
   - 7-day delay for fee changes
   - Prevents immediate parameter manipulation

2. **Transaction Limits**
   - Max 10,000 USDC per transaction
   - Max 50,000 USDC per day per user
   - Daily volume tracking with auto-reset

3. **Circuit Breaker**
   - Emergency shutdown mechanism
   - 3-day delay for emergency withdrawals
   - Prevents immediate fund extraction

4. **Rate Limiting**
   - Minimum 10 seconds between payments
   - Prevents spam and DoS attacks

5. **Access Control**
   - Role-based permissions (ADMIN_ROLE, OPERATOR_ROLE)
   - Foundation for multi-sig governance

6. **Reentrancy Protection**
   - OpenZeppelin ReentrancyGuard on all state-changing functions
   - Prevents reentrancy attacks

7. **Input Validation**
   - Length limits on strings
   - Address validation
   - Amount validation

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

Instead, please email: security@nuru.africa

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Critical issues within 30 days

## Bug Bounty Program

Coming soon. Rewards:
- Critical: $10,000 - $50,000
- High: $5,000 - $10,000
- Medium: $1,000 - $5,000
- Low: $100 - $1,000

## Audit Status

⚠️ **NOT YET AUDITED**

Professional security audit planned with:
- Trail of Bits
- OpenZeppelin
- Consensys Diligence

## Known Limitations

1. ENS resolution relies on frontend (oracle integration planned)
2. Single owner (multi-sig planned)
3. No formal verification yet

## Best Practices for Users

1. Verify transaction details before confirming
2. Start with small amounts
3. Check recipient address resolution
4. Monitor transaction status
5. Report suspicious activity

## Emergency Procedures

In case of security incident:
1. Contract can be paused by owner
2. Emergency shutdown can be triggered
3. Funds can be withdrawn after 3-day delay
4. All events are logged on-chain

## Contact

- Security: security@nuru.africa
- General: hello@nuru.africa
- Twitter: @NuruAfrica
