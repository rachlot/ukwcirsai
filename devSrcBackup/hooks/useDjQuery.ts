import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";
import { util } from "../api/Util";

/**
 * query evaluation evaluation hook
 */
export const useDjQuery = ({ database, query, cached }: any, args?: any) => {

    const dataProvider = useDataProvider()

    return useQuery(
        ['query', database, query, args],
        async () => {
            const data = await (cached ? dataProvider.queryCached(database, query, args) : dataProvider.query(database, query, args))
            const schema = await (cached ? dataProvider.queryMetaCached(database, query, args) : dataProvider.queryMeta(database, query, args))
            // query result might include extra cols that are not in metadata - infer the cols for these
            const inf = util.inferSchemaFromData(data)
            for (const c of Object.keys(inf.properties!))
                if (!schema.properties![c])
                    schema.properties![c] = inf.properties![c]
            return {
                data,
                schema
            }
        }
    );
}