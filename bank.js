export const chainId = 560048n;

export const bankAbi = [
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function checkBlance() view returns (uint256 balance)",
];

export function infuraUrl(apiKey) {
  if (!/^[a-z0-9]+$/i.test(apiKey)) {
    throw new Error("กรุณากรอก Infura API Key ให้ถูกต้อง");
  }
  return `https://hoodi.infura.io/v3/${apiKey}`;
}
