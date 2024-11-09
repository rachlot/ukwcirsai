import { useDataProvider, useGetOne } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { useLoc } from "../hooks/useLoc";
import { util } from "../api/Util";
import { PrintError } from "../components/PrintError";
import { SchemaHandler } from "./SchemaHandler";

/**
 * loads the default record visualization and displays it
 */
export const DefaultRecord = () => {
    util.isDefaultLayout = true
    const dataProvider = useDataProvider()
    const loc = useLoc();
    const { data, isLoading, error } = useGetOne('config/page', { id: 'default' });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // return <Layout widget={data.layout} />
    const id = 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table)
    return <SchemaHandler widget={data.layout} del={async () => {
        throw new Error('cannot delete the default record layout')
    }} save={async (edit) => {
        await dataProvider.update('config/Table', {
            id,
            data: {
                id,
                ID: id,
                instanceLayout: edit
            },
            previousData: data
        })
    }} />
}