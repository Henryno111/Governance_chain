# Governance Chain

A decentralized governance system built on Stacks blockchain using Clarity smart contracts.

## Overview

Governance Chain is a DAO governance framework that enables token holders to create proposals, vote on them, and execute approved actions on-chain. The system provides a transparent and decentralized way to manage community decisions.

## Features

- **Proposal Creation**: Any token holder can create governance proposals
- **Voting System**: Support for "For", "Against", and "Abstain" votes
- **Quorum Requirements**: Ensures sufficient participation for valid decisions
- **Timelock Mechanism**: Proposals have a defined voting period
- **On-chain Execution**: Approved proposals can trigger contract calls

## Smart Contracts

### Governance Chain Contract

The main contract (`governance_chain_contract.clar`) handles the core governance functionality:

- Creating and managing proposals
- Recording and tallying votes
- Finalizing proposals based on voting outcomes
- Executing approved proposals

## Development

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v0.14.0 or higher
- [Deno](https://deno.land/) for running tests

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/governance_chain.git
   cd governance_chain
   ```

2. Install dependencies:
   ```
   # Install Clarinet if you haven't already
   # See https://github.com/hirosystems/clarinet for installation instructions
   ```

### Testing

Run the test suite:

```
clarinet test
```

This will execute both unit tests and integration tests to verify contract functionality.

### Deployment

1. Configure your deployment settings in `Clarinet.toml`
2. Deploy to testnet:
   ```
   clarinet deploy --testnet
   ```

## Contract Error Codes

| Code | Description |
|------|-------------|
| 100  | Owner only operation |
| 101  | Entity not found |
| 102  | Unauthorized action |
| 103  | Proposal already exists |
| 104  | Proposal expired |
| 105  | Already voted on proposal |
| 106  | Insufficient tokens |
| 107  | Proposal still active |
| 108  | Proposal not active |
| 109  | Invalid vote type |

## Governance Parameters

- **Minimum Proposal Duration**: 144 blocks (~1 day)
- **Quorum Percentage**: 30% of total token supply
- **Approval Threshold**: 51% of votes must be "For"

## Usage Examples

### Creating a Proposal

```clarity
(contract-call? .governance_chain_contract create-proposal 
  "Proposal Title" 
  "Proposal Description" 
  u144 
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.my-contract 
  "my-function" 
  (list "arg1" "arg2"))
```

### Voting on a Proposal

```clarity
;; Vote "For" with 100 tokens
(contract-call? .governance_chain_contract vote u0 u1 u100)

;; Vote "Against" with 50 tokens
(contract-call? .governance_chain_contract vote u0 u2 u50)

;; Vote "Abstain" with 25 tokens
(contract-call? .governance_chain_contract vote u0 u3 u25)
```

### Finalizing a Proposal

```clarity
(contract-call? .governance_chain_contract finalize-proposal u0)
```

### Executing an Approved Proposal

```clarity
(contract-call? .governance_chain_contract execute-proposal u0)
```

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request