# Contributing to **HashJing NFT**

Thank you for taking the time to contribute! This document explains how to set up the project locally, style‑guide conventions, and how to send a solid pull‑request.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev
```

Open the dApp in your browser:

```
http://localhost:5175/hashjing-nft/
```

> **Note** : The repo uses **PNPM** in CI, but `npm` works fine for quick local tests.

## Running the test‑suite (optional)

The core contract is covered by Hardhat tests:

```bash
npm run test
```

Simulation scripts that generate rarity statistics live in `scripts/`—see
[`TEST_REPORT.md`](https://github.com/DataSattva/hashjing-nft/blob/main/TEST_REPORT.md).


## Coding guidelines

| Area                   | Rule / Tool                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| Language               | TypeScript 4.9+, React 18, wagmi v2                              |
| Lint / format          | ESLint + Prettier (run `npm run lint`)                           |
| Commit messages        | Conventional Commits (`feat: …`, `fix: …`, `docs: …`)            |
| Pull request checklist | 1 build passes · 2 lint passes · 3 screenshot/gif for UI changes |

---

## License

* **Code**: MIT (see `LICENSE-MIT.md`)
* **Visuals & mandala concept**: CC BY‑NC 4.0

---

## For end‑users

End‑user instructions live in [`README.md`](https://github.com/DataSattva/hashjing-nft/blob/main/README.md).

## Contacts and Resources

For a detailed list of HashJing contacts and resources, see the page [Contacts and Resources](https://datasattva.github.io/hashjing-res/)

Happy hacking —and may your hashes be ever balanced! 🚀