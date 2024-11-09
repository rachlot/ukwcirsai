import { useDataProvider, useGetOne } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { useLoc } from "../hooks/useLoc";
import { DefaultTable } from "./DefaultTable";
import { util } from "../api/Util";
import { PrintError } from "../components/PrintError";
import React from "react";
import { TableContext } from "../hooks/TableContext";
import { SchemaHandler } from "./SchemaHandler";

/**
 * renders the tableLayout - or if not specified, the default Table layout
 */
export const TablePage = () => {
    const loc = useLoc();
    const dataProvider = useDataProvider()
    const { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table) });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    document.title = loc.table!

    if (data.tableLayout) {
        util.isDefaultLayout = false
        // return <Layout widget={data.tableLayout} />
        const id = 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table)
        return <TableContext.Provider value={data}><SchemaHandler widget={data.tableLayout} del={async () => {
            await dataProvider.update('config/Table', {
                id,
                data: {
                    id,
                    ID: id,
                    tableLayout: null
                },
                previousData: data
            })
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
        }} /></TableContext.Provider>
    }
    else
        return <TableContext.Provider value={data}><DefaultTable /></TableContext.Provider>
}