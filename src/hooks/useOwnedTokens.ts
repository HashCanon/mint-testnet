// hooks/useOwnedTokens.ts
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { getOwnedTokenIds, getTokenURI } from '../logic'
import { toast } from 'sonner'

export function useOwnedTokens() {
    const { address, isConnected } = useAccount()
    const [tokens,  setTokens ] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isConnected || !address) { setTokens([]); return }

        setLoading(true)
        const toastId = toast.info('Loading your mandalas…', { duration: Infinity })

        ;(async () => {
        try {
            const ids = await getOwnedTokenIds(address)           // bigint[] | number[]
            const metas = await Promise.all(
            ids.map(async (raw) => {
                const id   = typeof raw === 'bigint' ? Number(raw) : raw
                const meta = await getTokenURI(id)
                return { ...meta, _id: id }
            }),
            )
            metas.sort((a, b) => b._id - a._id)                   // newest first
            setTokens(metas)
        } catch (err) {
            console.error('useOwnedTokens:', err)
            toast.error('Failed to load mandalas')
        } finally {
            setLoading(false)
            toast.dismiss(toastId)
        }
        })()
    }, [isConnected, address])

    return { tokens, loading }
}