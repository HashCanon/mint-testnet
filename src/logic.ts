import { ethers } from 'ethers'
import { CONTRACTS, CONTRACT_ABI } from './constants'

/* provider + contract helper (ethers v6) */
export const getContract = async (withSigner = false) => {
  if (!window.ethereum) throw new Error('No wallet found')

  const provider = new ethers.BrowserProvider(window.ethereum)
  const network  = await provider.getNetwork()

  const address =
    CONTRACTS[Number(network.chainId)] ?? CONTRACTS[11155111] // fallback → Sepolia

  const signer = withSigner ? await provider.getSigner() : undefined
  return new ethers.Contract(address, CONTRACT_ABI, signer || provider)
}

/* mint() payable 0.002 ETH */
export const mintNFT = async () => {
  const contract = await getContract(true)
  return contract.mint({ value: ethers.parseEther('0.002') })
}

/* read mintingEnabled (fallback → true) */
export const getMintingStatus = async (): Promise<boolean> => {
  const contract = await getContract()
  try {
    if (typeof contract.mintingEnabled === 'function')
      return await contract.mintingEnabled()
    return true
  } catch {
    console.warn('mintingEnabled() failed, fallback → true')
    return true
  }
}

/* totalSupply → number */
export const getTotalMinted = async (): Promise<number> => {
  const contract = await getContract()
  const total: bigint = await contract.totalSupply()
  return Number(total) // OK while totalSupply < 9 000 000 000 000 000
}

/* tokenURI → parsed JSON */
export const getTokenURI = async (tokenId: number) => {
  const contract = await getContract()
  const uri: string = await contract.tokenURI(tokenId)
  const json = atob(uri.split(',')[1])
  return JSON.parse(json)
}
