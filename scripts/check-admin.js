const { ethers } = require("hardhat");

async function main() {
  const contract = await ethers.getContractAt("CertChain", "0xD5cB65671dcB03476592A3096A9CB0ED52e75719");
  const admin = await contract.admin();
  console.log("Contract admin:", admin);
}

main();
