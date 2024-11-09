import { useListContext, useResourceContext } from "react-admin"

/**
 * persist perPage, sort, and filterValues
 */
export const ListContextListener = ({ resource }: { resource?: string }) => {
    const c = useListContext()
    const rc = useResourceContext()
    const key = 'RaStore.preferences.' + (rc ? rc : resource) + '.listParams'
    localStorage.setItem(key, JSON.stringify({
        filterValues: c.filterValues,
        sort: c.sort,
        perPage: c.perPage
    }))
    return <></>
}