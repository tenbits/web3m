## [`0xweb`](https://0xweb.org) - Contract package manager and CLI Web3 Toolkit


<p align='center'>
    <img src='images/background.jpg'/>
</p>

----
[![Website Link](https://img.shields.io/badge/%F0%9F%8C%90-website-green.svg)](https://0xweb.org)
[![Documentation Link](https://img.shields.io/badge/%E2%9D%93-documentation-green.svg)](https://docs.0xweb.org)
[![NPM version](https://badge.fury.io/js/0xweb.svg)](http://badge.fury.io/js/0xweb)
[![CircleCI](https://circleci.com/gh/0xweb-org/0xweb.svg?style=svg)](https://circleci.com/gh/0xweb-org/0xweb)

| | |
|--|--|
|[Demo: Backend](https://github.com/0xweb-org/examples-backend) | [![CircleCI](https://dl.circleci.com/status-badge/img/gh/0xweb-org/examples-backend/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/0xweb-org/examples-backend/tree/master) |
|[Demo: Storage](https://github.com/0xweb-org/examples-storage) | [![CircleCI](https://dl.circleci.com/status-badge/img/gh/0xweb-org/examples-storage/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/0xweb-org/examples-storage/tree/master) |
|[Demo: Hardhat](https://github.com/0xweb-org/examples-hardhat) | [![CircleCI](https://dl.circleci.com/status-badge/img/gh/0xweb-org/examples-hardhat/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/0xweb-org/examples-hardhat/tree/master) |




Generate TypeScript or ES6 classes for contracts fetched from Etherscan and Co.

> We use [📦 dequanto library](https://github.com/0xweb-org/dequanto) for the wrapped classes

Here the example of generated classes: [0xweb-org/0xweb-sample 🔗](https://github.com/0xweb-org/0xweb-sample)


### Install

```bash
$ npm i 0xweb -g

# Boostrap dequanto library in cwd
$ 0xweb init

# Download sources/ABI and generate TS classes
$ 0xweb install 0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419 --name chainlink/oracle-eth
```

> Use the `--hardhat` flag, if you want to develop|compile|deploy|test contracts: `0xweb init --hardhat`

#### API Usage

> Use autogenerated TypeScript classes for much safer and faster backend implementation

```ts
import { ChainlinkOracleEth } from '0xc/eth/chainlink/oracle-eth/oracle-eth';
import { Config } from 'dequanto/config/Config';
import { $bigint } from 'dequanto/utils/$bigint';

await Config.fetch();

let oracle = new ChainlinkOracleEth();
let decimals = await oracle.decimals();
let price = await oracle.latestAnswer();

console.log(`ETH Price`, $bigint.toEther(price, decimals));
```

### CLI Usage

> **READ** and **WRITE** to installed contracts directly from the command line

```bash
$ 0xweb contract chainlink/oracle-eth latestAnswer
```


## Config

> ❗❣️❗ We include our default KEYs for etherscan/co and infura. They are rate-limited. Please, create and insert your keys. Thank you!

```bash
$ 0xweb config --edit

## optionally, you can provide the Nodes Endpoint with `--endpoint` flag
$ 0xweb COMMAND --endpoint https://my-node-url-here
```

## [Commands overview 🔗](https://docs.0xweb.org/cli/commands-overview)

## Various Blockchain tools

> Get the commands overview

```bash
$ 0xweb --help
$ 0xweb install --help
```

### `block`

1. Get current block info

```bash
$ 0xweb block get latest
```

### `token`

1. Get Token Price

```bash
$ 0xweb token price WETH
```

### `accounts`

**🔐 Wallet** feature allows to store accounts in encrypted local storage. We use local machine KEY and provided PIN in arguments or environment to create cryptographically strong secrets 🔑 for account encryption.

When calling contracts `WRITE` methods, you should first add an account to the wallet, and then use PIN to unlock the storage

```bash
$ 0xweb account add --name foo --key the_private_key --pin foobar
$ 0xweb token transfer USDC --from foo --to 0x123456 --amount 20 --pin foobar
```

🏁

----
©️ MIT License.
