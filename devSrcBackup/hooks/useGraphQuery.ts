import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";

/**
 * query evaluation evaluation hook
 */
export const useGraphQuery = (database: string, query: string, args?: any) => {

    const dataProvider = useDataProvider()

    return useQuery(
        ['query', database, query, args],
        async () => {
            return await dataProvider.queryGraph(database, query, args)
        }
    );
}