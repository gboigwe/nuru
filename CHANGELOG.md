# Changelog

All notable changes to Nuru will be documented in this file.

## [Unreleased]

### Added - Issue #71: Smart Contract Security Audit and Hardening

#### Security Features
- Timelock for admin fee changes (7-day delay)
- Transaction limits (10k USDC per tx, 50k per day)
- Circuit breaker with emergency shutdown
- Rate limiting (10 seconds between payments)
- AccessControl for role-based permissions
- Enhanced reentrancy protection
- Stricter input validation

#### Documentation
- SECURITY.md - Comprehensive security policy
- AUDIT_PREP.md - Audit preparation checklist
- THREAT_MODEL.md - Complete threat analysis
- EMERGENCY_RESPONSE.md - Incident response procedures

#### Contract Improvements
- Multi-sig foundation with AccessControl
- Emergency withdrawal with 3-day delay
- Daily volume tracking per user
- ENS name and voice hash length limits
- Prevent sending to contract address
- Minimum USDC amount validation

#### Events Added
- FeeChangeQueued
- FeeChangeExecuted
- EmergencyShutdown
- EmergencyWithdrawal
- DailyLimitExceeded

---

**Completed by:** Amazon Q  
**Date:** 2025  
**Total Commits:** 13  
**Status:** ✅ Ready for Review
