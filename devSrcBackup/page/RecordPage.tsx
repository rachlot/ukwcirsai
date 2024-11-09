import { ShowBase, useDataProvider, useGetOne, useRecordContext } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { useLoc } from "../hooks/useLoc";
import { DefaultRecord } from "./DefaultRecord";
import { util } from "../api/Util";
import { Page } from "./Page";
import { PrintError } from "../components/PrintError";
import { SchemaHandler } from "./SchemaHandler";

/**
 * renders the instanceLayout - or if not specified, the default instance layout
 */
export const RecordPage = () => {
    const dataProvider = useDataProvider()
    const loc = useLoc();
    const { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table) });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (loc.withPage)
        return <ShowBase>
            <LoadRecord>
                <Page />
            </LoadRecord>
        </ShowBase>


    // make sure we set tje record context by wrapping the page in <ShowBase>
    if (data.instanceLayout) {
        util.isDefaultLayout = false
        const id = 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table)

        return <ShowBase>
            <LoadRecord table={data}>
                <SchemaHandler widget={data.instanceLayout} del={async () => {
                    await dataProvider.update('config/Table', {
                        id,
                        data: {
                            id,
                            ID: id,
                            instanceLayout: null
                        },
                        previousData: data
                    })
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
            </LoadRecord>
        </ShowBase>
    }
    else
        return <ShowBase>
            <LoadRecord>
                <DefaultRecord />
            </LoadRecord>
        </ShowBase>
}

/**
 * make sure useRecordContext() returns the record in this subtree
 */
const LoadRecord = (props: any) => {
    const record = useRecordContext()
    const loc = useLoc()
    if (!record) return <Loading />

    document.title = props.table?.['dj-label'] ? util.label(props.table['dj-label'], record) : loc.id!

    return props.children
}