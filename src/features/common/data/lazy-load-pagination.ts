import { Atom, atom, useAtomValue, useStore } from 'jotai'
import { JotaiStore } from './types'
import { useMemo } from 'react'
import { loadable } from 'jotai/utils'

export type LoadDataResponse<TData> = {
  items: TData[]
  nextPageToken?: string
}

export type RawDataPage<TData> = {
  items: TData[]
  hasNextPage: boolean
}

export type ViewModelPage<TViewModel> = {
  items: TViewModel[]
  hasNextPage: boolean
}

type FetchRawData<TData> = (nextPageToken?: string) => Atom<Promise<LoadDataResponse<TData>>>

type CreateLoadableViewModelPageAtomInput<TRawData, TViewModel> = {
  fetchRawData: FetchRawData<TRawData>
  createViewModelPageAtom: (
    store: JotaiStore,
    rawDataPage: RawDataPage<TRawData>
  ) => Atom<Promise<ViewModelPage<TViewModel>> | ViewModelPage<TViewModel>>
}
export function createLoadableViewModelPageAtom<TRawData, TViewModel>({
  fetchRawData,
  createViewModelPageAtom,
}: CreateLoadableViewModelPageAtomInput<TRawData, TViewModel>) {
  return (pageSize: number) => {
    const itemsAtom = atom<TRawData[]>([])
    const nextPageTokenAtom = atom<string | undefined>(undefined)

    const createRawPageAtom = (store: JotaiStore, pageSize: number, pageNumber: number) => {
      return atom(async (get) => {
        const index = pageNumber - 1

        const cache = store.get(itemsAtom)
        const itemsFromCache = cache.slice(index * pageSize, (index + 1) * pageSize)

        if (itemsFromCache.length === pageSize)
          return {
            items: itemsFromCache,
            hasNextPage: true,
          } satisfies RawDataPage<TRawData>

        const { items, nextPageToken } = await get(fetchUntilTheNextPageIsFull(fetchRawData, pageSize, store.get(nextPageTokenAtom)))
        const nextCache = Array.from(cache).concat(items)

        store.set(itemsAtom, nextCache)
        store.set(nextPageTokenAtom, nextPageToken)

        // The way that we determine hasNextPage is not 100% foolproof
        // because indexer return nextPageToken even if there is no more data
        // we only know if there is no more data by fetching the next page
        return {
          items: nextCache.slice(index * pageSize, (index + 1) * pageSize),
          hasNextPage: !!nextPageToken,
        } satisfies RawDataPage<TRawData>
      })
    }

    const createPageAtom = (store: JotaiStore, pageSize: number, pageNumber: number) => {
      return atom(async (get) => {
        const rawDataPage = await get(createRawPageAtom(store, pageSize, pageNumber))
        return get(createViewModelPageAtom(store, rawDataPage))
      })
    }

    const usePageAtom = (pageSize: number, pageNumber: number) => {
      const store = useStore()

      return useMemo(() => {
        return createPageAtom(store, pageSize, pageNumber)
      }, [store, pageSize, pageNumber])
    }

    return (pageNumber: number) => {
      return useAtomValue(loadable(usePageAtom(pageSize, pageNumber)))
    }
  }
}

function fetchUntilTheNextPageIsFull<TData>(fetchRawData: FetchRawData<TData>, pageSize: number, nextPageToken?: string) {
  // Sometimes, the fetchRawData function doesn't return the right amount of data
  // for example, getting transactions for an account
  // This function will fetch more data until the page is full
  return atom(async (get) => {
    const items: TData[] = []
    let newNextPageToken: string | undefined = undefined

    while (items.length < pageSize) {
      const response: LoadDataResponse<TData> = await get(fetchRawData(newNextPageToken ?? nextPageToken))
      if (response.items.length === 0) {
        newNextPageToken = undefined
        break
      }

      items.push(...response.items)
      newNextPageToken = response.nextPageToken
    }

    return {
      items: items,
      nextPageToken: newNextPageToken,
    } as const
  })
}