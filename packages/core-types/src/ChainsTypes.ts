export enum ChainNames {
  Mainnet = "mainnet",
  Ropsten = "ropsten",
  Rinkeby = "rinkeby",
  Goerli = "goerli",
  Kovan = "kovan",
  Xdai = "xdai",
  Bsc = "bsc",
  BscTest = "bscTest",
  Fantom = "fantom",
  FantomTest = "fantomTest",
  Matic = "matic",
  Mumbai = "mumbai",
  Aurora = "aurora",
  AuroraTest = "auroraTest",
  Avalanche = "avalanche",
  Fuji = "fuji",
  Optimism = "optimism",
  OptimismKovan = "optimismKovan",
  Arbitrum = "arbitrum",
  ArbitrumTest = "arbitrumTest",
  Moonbeam = "moonbeam",
  Moonbase = "moonbase",
  Celo = "celo",
  CeloTest = "celoTest",
}

// NOTE: Update chainId for networks we're planning to support
export enum ChainId {
  // Ethereum
  MAINNET = 1,
  GOERLI = 5,
  POLYGON_MUMBAI = 80001,
  POLYGON_MAINNET = 137,
  BSC_TESTNET = 97,
  BSC_MAINNET = 56,
  POLYGON_ZKEVM_TESTNET = 1442,
  POLYGON_ZKEVM_MAINNET = 1101,
  ARBITRUM_GOERLI_TESTNET = 421613,
  ARBITRUM_ONE_MAINNET = 42161,
  ARBITRUM_NOVA_MAINNET = 42170,
  OPTIMISM_MAINNET = 10,
  OPTIMISM_GOERLI_TESTNET = 420,
  AVALANCHE_MAINNET = 43114,
  AVALANCHE_TESTNET = 43113,
  MOONBEAM_MAINNET = 1284,
  BASE_GOERLI_TESTNET = 84531,
  BASE_MAINNET = 8453,
  LINEA_TESTNET = 59140,
  LINEA_MAINNET = 59144,
  MANTLE_MAINNET = 5000,
  MANTLE_TESTNET = 5001,
  OPBNB_MAINNET = 204,
  OPBNB_TESTNET = 5611,
  GANACHE = 1337, //Temp
}
