const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const Contract = await ethers.getContractFactory("CertChain");
  const contract = await Contract.deploy();

  await contract.deployed();

  console.log("Deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});