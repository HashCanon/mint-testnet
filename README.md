# HashJing Mint — Testnet

HashJing creates fully-on-chain mandala-shaped NFTs.  
This page lets you try the experience on **Sepolia** before the mainnet release.

Tokens minted here are for testing only and carry no monetary value.

## What you need

| Item | Details |
|------|---------|
| Browser wallet | MetaMask (desktop / mobile) or any WalletConnect-compatible wallet |
| Sepolia ETH | Grab a small amount from a faucet:<br>• faucet.quicknode.com<br>• sepoliafaucet.com<br>• Alchemy / Infura faucets |

## Minting steps

1. Open the mint page. The status line shows **N / 8192 minted**.  
2. Click **Connect Wallet** and choose your wallet.  
3. If the wallet is on another network, approve the switch to **Sepolia**.  
4. Press **Mint now**. Sign the transaction for **0.002 ETH** in the wallet.  
5. Wait for the banner **Mint successful**.  
6. Your SVG and attributes appear in **Your Minted Mandalas**.

## Cost

| Item | Amount |
|------|--------|
| Mint price | **0.002 ETH** (testnet) |
| Gas fee | Standard Sepolia gas, paid separately |

## Rarity scale

HashJing assigns every trait a five-star rarity rating (percentages are taken from the full-run simulations in
[TEST_REPORT.md](https://github.com/DataSattva/hashjing-nft/blob/main/TEST_REPORT.md)):

| Share of the collection | Category    | Stars |
|-------------------------|-------------|-------|
| **< 1 %**               | Ultra rare  | ★★★★★ |
| **1 – 5 %**             | Very rare   | ★★★★☆ |
| **5 – 15 %**            | Uncommon    | ★★★☆☆ |
| **15 – 30 %**           | Common      | ★★☆☆☆ |
| **≥ 30 %**              | Very common | ★☆☆☆☆ |

### Balanced trait

* **Balanced = true** ≈ 5 % → ★★★★☆  
* **Balanced = false** ≈ 95 % → ★☆☆☆☆  

### Passages trait

| Value | % of tokens | Stars |
|-------|-------------|-------|
| 0     | 0.06 % | ★★★★★ |
| 1     | 0.70 % | ★★★★★ |
| 2     | 4.10 % | ★★★★☆ |
| 3     | 13.0 % | ★★★☆☆ |
| 4     | 23.5 % | ★★☆☆☆ |
| 5     | 27.0 % | ★★☆☆☆ |
| 6     | 19.0 % | ★★☆☆☆ |
| 7     | 9.30 % | ★★★☆☆ |
| 8     | 2.90 % | ★★★★☆ |
| 9     | 0.55 % | ★★★★★ |
| 10    | 0.08 % | ★★★★★ |
| 11    | 0.01 % | ★★★★★ |

The figures come from three complete mint simulations covering all 8 192 possible hashes.

## FAQ

| Question | Answer |
|----------|--------|
| Do I have to keep the testnet token? | Not at all. Burn it or keep it—it will never move to mainnet. |
| Is the SVG stored off-chain? | No. The image and metadata are base64-encoded in `tokenURI` inside the contract. |
| When is the mainnet drop? | Follow the project site or Twitter **@HashJing** for the official announcement. |

## Community & Support

[![Join the discussion](https://img.shields.io/github/discussions/DataSattva/hashjing?logo=github)](https://github.com/DataSattva/hashjing/discussions)

Questions, ideas or bug reports?  
Open a thread in [**HashJing Discussions**](https://github.com/DataSattva/hashjing/discussions) and let’s talk!

For a detailed list of HashJing contacts and resources, see the page [**Contacts and Resources**](https://datasattva.github.io/hashjing-res/).

