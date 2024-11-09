import { useGetOne, useResourceContext } from "ra-core";
import { util } from "../api/Util";

/**
 * loads the schema for the current resource context
 * TODO: use it! see other useGetOne('config/Table',
 */
export const useSchema = () => {
    const [database, table] = util.parseResource(useResourceContext())
    if (!table)
        return { data: undefined, isLoading: false, error: 'Cannot get schema: no resource context set' }
    /* eslint-disable */
    return useGetOne('config/Table', { id: 'dj/' + database + '/' + util.encodeTableOrColumnName(table) });
    /* eslint-enable */
}