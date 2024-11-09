import { useDataProvider, useGetOne } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { useLoc } from "../hooks/useLoc";
import { util } from "../api/Util";
import { PrintError } from "../components/PrintError";
import { SchemaHandler } from "./SchemaHandler";

/**
 * renders the default table layout
 */
export const DefaultTable = () => {
    util.isDefaultLayout = true
    const loc = useLoc();
    const dataProvider = useDataProvider()

    const { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/config/Table' });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // return <Layout widget={data.instanceLayout} />
    const id = 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table)
    return <SchemaHandler widget={data.instanceLayout} del={async () => {
        throw new Error('cannot delete the default table layout')
    }} save={async (edit) => {
        await dataProvider.update('config/Table', {
            id,
            data: {
                id,
                ID: id,
                tableLayout: edit
            },
            previousData: data
        })
    }} />
}