import { readFile } from "node:fs/promises";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";
import solc from "solc";
import { chainId, infuraUrl } from "../bank.js";

async function deploy() {
  const { INFURA_API_KEY, DEPLOYER_PRIVATE_KEY } = process.env;
  if (!INFURA_API_KEY || !DEPLOYER_PRIVATE_KEY) {
    throw new Error("Set INFURA_API_KEY and DEPLOYER_PRIVATE_KEY in .env.");
  }

  const source = await readFile(new URL("../contracts/Bank.sol", import.meta.url), "utf8");
  const compilation = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { "Bank.sol": { content: source } },
    settings: { evmVersion: "paris", outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  })));
  const errors = (compilation.errors ?? []).filter(({ severity }) => severity === "error");
  if (errors.length) throw new Error(errors.map(({ formattedMessage }) => formattedMessage).join("\n"));
  const { abi, evm } = compilation.contracts["Bank.sol"].Bank;

  const provider = new JsonRpcProvider(infuraUrl(INFURA_API_KEY), undefined, { batchMaxCount: 1 });
  try {
    if ((await provider.getNetwork()).chainId !== chainId) throw new Error("Expected Hoodi.");
    const factory = new ContractFactory(abi, evm.bytecode.object, new Wallet(DEPLOYER_PRIVATE_KEY, provider));
    const contract = await factory.deploy();
    console.log("Deployment transaction:", contract.deploymentTransaction().hash);
    await contract.waitForDeployment();
    console.log("Bank contract address:", await contract.getAddress());
  } finally {
    provider.destroy();
  }
}

deploy().catch((error) => {
  // RPC errors can contain the full authenticated URL.
  console.error(error.code ? `Deployment failed (${error.code}). Check the key and Hoodi ETH balance.` : error.message);
  process.exitCode = 1;
});
