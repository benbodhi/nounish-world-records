import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    artifacts: 'artifacts',
  },
  mocha: {
    timeout: 20000
  }
};

export default config;
