const AMOUNTS = {
  low: "0.0001",
  medium: "0.001",
  high: "0.002",
};

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

module.exports = { AMOUNTS, ERC20_ABI };
