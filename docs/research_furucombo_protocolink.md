# Furucombo / Protocolink Research Notes

## Sources

- Furucombo docs root: https://docs.furucombo.app/
- Furucombo deployed contracts page: https://docs.furucombo.app/resources/deployed-contracts
- Protocolink deployment addresses: https://docs.protocolink.com/smart-contract/deployment-addresses

## Key Observation

Furucombo states Protocolink is its backend system for secure/flexible execution.

## Address Snapshot (from docs at research time)

> These are reference addresses from documentation and must be verified on-chain before production use.

- Router: `0xDec80E988F4baF43be69c13711453013c212feA8`
- AgentImplementation: `0x4D4c961De7140E642b7217f221b73e859E3A6482`
- AaveV2FlashLoanCallback: `0x727c55092C7196d65594A8e4F39ae8dC0cB39173`
- AaveV3FlashLoanCallback: `0x6f81cf774052D03873b32944a036BF0647bFB5bF`
- BalancerV2FlashLoanCallback: `0xA15B9C132F29e91D99b51E3080020eF7c7F5E350`
- CREATE3Factory: `0xFa3e9a110E6975ec868E9ed72ac6034eE4255B64`

## clawdCombo Design Direction

1. Keep Router-like orchestration contract for multi-step atomic execution.
2. Separate AdapterRegistry to manage allowlisted adapters and versioning.
3. Add simulation hooks and stricter calldata validation.
4. Add explicit risk controls: slippage, max gas, allowed tokens/protocols.
5. Start Polygon-first and expand to multi-chain.

## TODO

- Pull verified ABIs from chain explorers where available
- Build compatibility test vectors from real strategy flows
- Compare callback semantics (Aave V3, Balancer flashloans)
