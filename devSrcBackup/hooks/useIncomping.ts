import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";
import { util } from "../api/Util";
import { Schema } from "../model/schema";

/**
 * query incoming
 * 
 * this uses the server's "incoming" api. since we use the RA reference many
 * functionality, we only call the API with offset/limit 0/1
 * in order to find the FKs pointing to this record.
 * 
 * the reference many functionality then gets the actual data via the data provider
 * 
 * we could optimize this by adding a new call to the backend or by
 * interpreting limit=0 in a special way
 * 
 * the implementation also adds the pk names to the result
 */
export const useIncoming = (database: string, table: string, id: any) => {

    const dataProvider = useDataProvider()

    return useQuery(
        ['query', database, table, id],
        async () => {
            const incoming = await dataProvider.incoming(database, table, id, 0, 1)
            for (const i of incoming) {
                const fk = util.parseColumnID(i.fk)

                // get schema of the related table in order to add the 
                // pk names to the result
                const schema = await dataProvider.getOne('config/Table', { id: 'dj/' + fk.database + '/' + util.encodeTableOrColumnName(fk.table) })
                i.id.pkCols = []
                for (const p of Object.values((schema.data as Schema).properties!))
                    if (util.isValue(p.pkpos))
                        i.id.pkCols[p.pkpos!] = p.name
            }
            return incoming
        }
    );
}