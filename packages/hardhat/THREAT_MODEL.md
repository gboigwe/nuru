# Threat Model - VoiceRemittance Contract

## Assets

1. **User Funds** (ETH/USDC in escrow)
2. **Platform Fees** (accumulated fees)
3. **User Data** (profiles, reputation scores)
4. **Voice Receipts** (IPFS hashes)

## Threat Actors

1. **Malicious Users** - Attempt to steal funds or manipulate system
2. **Compromised Owner** - Owner key stolen or malicious
3. **External Attackers** - Exploit contract vulnerabilities
4. **Malicious Frontend** - Manipulate ENS resolution

## Attack Vectors

### 1. Reentrancy Attacks
**Risk**: High  
**Mitigation**: 
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Checks-Effects-Interactions pattern
- ✅ Rate limiting

### 2. Front-Running
**Risk**: Medium  
**Mitigation**:
- ✅ Rate limiting (10s between txs)
- ⚠️ Consider commit-reveal for sensitive operations

### 3. Integer Overflow/Underflow
**Risk**: Low (Solidity 0.8+)  
**Mitigation**:
- ✅ Built-in overflow protection
- ✅ Input validation

### 4. Access Control Bypass
**Risk**: High  
**Mitigation**:
- ✅ OpenZeppelin Ownable
- ✅ AccessControl roles
- ✅ Modifier checks

### 5. DoS Attacks
**Risk**: Medium  
**Mitigation**:
- ✅ Rate limiting
- ✅ Transaction limits
- ✅ Gas optimization

### 6. Flash Loan Attacks
**Risk**: Low  
**Mitigation**:
- ✅ No price oracles used
- ✅ No lending/borrowing
- ✅ Simple payment flow

### 7. ENS Resolution Manipulation
**Risk**: High  
**Mitigation**:
- ⚠️ Frontend provides resolution (trust assumption)
- 🔄 Chainlink oracle integration planned
- ✅ ENS cache for verification

### 8. Admin Key Compromise
**Risk**: Critical  
**Mitigation**:
- ✅ Timelock for fee changes (7 days)
- ✅ Emergency shutdown mechanism
- ✅ AccessControl roles
- 🔄 Multi-sig planned

### 9. Griefing Attacks
**Risk**: Medium  
**Mitigation**:
- ✅ Rate limiting
- ✅ Daily volume limits
- ✅ Minimum payment amounts

### 10. Economic Exploits
**Risk**: Medium  
**Mitigation**:
- ✅ Platform fee capped at 3%
- ✅ Transaction limits
- ✅ Daily limits per user

## Trust Assumptions

1. **ENS Resolution**: Frontend correctly resolves ENS names
2. **USDC Contract**: USDC token contract is secure
3. **Owner**: Contract owner acts in good faith
4. **Filecoin**: IPFS hashes are immutable

## Security Controls

### Preventive Controls
- Input validation
- Access controls
- Rate limiting
- Transaction limits
- Reentrancy guards

### Detective Controls
- Event logging
- Transaction monitoring (planned)
- Anomaly detection (planned)

### Corrective Controls
- Pause mechanism
- Emergency shutdown
- Emergency withdrawal (with delay)
- Cancel payment function

## Residual Risks

1. **ENS Oracle Dependency** - Requires Chainlink integration
2. **Single Owner** - Requires multi-sig
3. **Frontend Trust** - Requires decentralized frontend
4. **No Formal Verification** - Requires Certora audit

## Recommendations

### High Priority
1. Integrate Chainlink ENS oracle
2. Implement multi-sig ownership
3. Professional security audit
4. Formal verification

### Medium Priority
1. Decentralized frontend
2. Bug bounty program
3. Transaction monitoring
4. Insurance coverage

### Low Priority
1. Upgrade mechanism
2. Governance token
3. DAO transition
