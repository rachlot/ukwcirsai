import { useListContext, useGetOne, useGetList, useRecordContext, useDataProvider, useNotify, useRefresh, useUnselectAll, useResourceContext } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { util } from "../api/Util";
import { MyListGuesser } from "../components/MyListGuesser";
import { Value } from "../components/Value";
import { useDjQuery } from "../hooks/useDjQuery";
import { useExpression } from "../hooks/useExpression";
import { useLoc } from "../hooks/useLoc";
import { useSearch } from "../hooks/useSearch";
import { SearchResult } from "../model/search-result";
import { Widget } from "../model/widget";
import { _arguments, database, expression, graph, perPage, query, title } from "../api/Const";
import { Icon } from '@mui/material'
import { useGraphQuery } from "../hooks/useGraphQuery";
import { PrintError } from "../components/PrintError";
import { Button, BulkDeleteButton, TextInput, List, DatagridConfigurable, TextField, ReferenceField, FunctionField } from "react-admin";
import { Actions } from "../components/Actions";
import { Link } from 'react-router-dom';
import { ListContextListener } from "../components/ListContextListener";
import { profile } from "../api/Profile";

/**
 * table widget that renders
 * 
 * query 
 * jsonata 
 * search
 * "all" table
 */
export const Table = ({ widget }: { widget: Widget }) => {

    const loc = useLoc()
    if (widget.expression) {
        return <ExpressionTable widget={widget} />
    } else if (widget.query && widget.database && widget.arguments) {
        return <QueryTableArgs widget={widget} />
    } else if (widget.query && widget.database) {
        if (widget.graph)
            return <GraphQueryTable widget={widget} />
        else
            return <QueryTable widget={widget} />
    } else if (loc.type === 'search') {
        return <SearchTable widget={widget} />
    } else if (loc.type === 'page') {
        return <p>Table - please provide a query or expression</p>
    } else {
        return <AllTable widget={widget} />
    }
}

export const ExpressionTable = ({ widget }: { widget: Widget }) => {
    const { data, isLoading, error } = useExpression(widget.cached!, widget.expression!)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // infer schema
    return <Value data={data} schema={util.inferSchemaFromData(data)} resource={widget.expression!} perPage={widget.perPage}></Value>
}

export const QueryTableArgs = ({ widget }: { widget: Widget }) => {
    // db query
    const { data, isLoading, error } = useExpression(widget.cached!, widget.arguments!)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <QueryTable widget={widget} args={data} />
}

export const QueryTable = ({ widget, args }: { widget: Widget, args?: any }) => {
    const rc = useResourceContext()
    const key = 'RaStore.preferences.' + rc + '.listParams'
    const listParams = profile.local(key)
    // db query
    const { data, isLoading, error } = useDjQuery(widget, args)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const lookup: any = {}
    for (const row of data?.data)
        lookup[row.ID] = row

    if (widget.database === 'config') {
        if (widget.query === 'dj-functions')
            return <List
                perPage={listParams?.perPage ? listParams?.perPage : undefined}
                sort={listParams?.sort ? listParams?.sort : undefined}
                filterDefaultValues={listParams?.filterValues ? listParams?.filterValues : undefined}
                disableSyncWithLocation actions={<Actions />} filters={[
                    /* eslint-disable */
                    <TextInput source="ID"></TextInput>,
                    <TextInput source="database"></TextInput>,
                    <TextInput source="comment"></TextInput>,
                    <TextInput source="type"></TextInput>,
                    <TextInput source="roles"></TextInput>,
                    <TextInput source="status"></TextInput>,
                    /* eslint-enable */
                ]}>
                <ListContextListener />
                <DatagridConfigurable
                    bulkActionButtons={<><BulkRun></BulkRun><BulkDeleteButton /></>}
                    sx={{
                        "& .RaDatagrid-rowCell": {
                            whiteSpace: "nowrap",
                            maxWidth: '300px',
                            overflowX: 'hidden'
                        },
                        "& .RaDatagrid-headerCell": {
                            whiteSpace: "nowrap",
                        },
                    }}
                >
                    <ReferenceField source="ID" reference="config/dj-function" />
                    <FunctionField source="djClassName" label="Class" render={(record: any) => {
                        const name = record.djClassName?.split('.')
                        return name?.[name.length - 1]
                    }}></FunctionField>
                    <TextField source="database" />
                    <TextField source="comment" />
                    <TextField source="type" />
                    <TextField source="roles" />
                    <TextField source="status" />
                    <FunctionField source="start" render={(record: any) => lookup[record.ID]?.start} />
                    <FunctionField source="end" render={(record: any) => lookup[record.ID]?.end} />
                    <FunctionField label="Used By" render={(record: any) => lookup[record.ID]?.usedBy} />
                    <FunctionField label="Runtime (s)" render={(record: any) => lookup[record.ID]?.['runtime (s)']} />
                </DatagridConfigurable>
            </List >
        if (widget.query === 'dj-page-urls')
            return <List
                perPage={listParams?.perPage ? listParams?.perPage : undefined}
                sort={listParams?.sort ? listParams?.sort : undefined}
                filterDefaultValues={listParams?.filterValues ? listParams?.filterValues : undefined}
                disableSyncWithLocation actions={<Actions />} filters={[
                ]}>
                <ListContextListener />
                <DatagridConfigurable
                    sx={{
                        "& .RaDatagrid-rowCell": {
                            whiteSpace: "nowrap",
                            maxWidth: '300px',
                            overflowX: 'hidden'
                        },
                        "& .RaDatagrid-headerCell": {
                            whiteSpace: "nowrap",
                        },
                    }}
                >
                    <LinkField label="URL" source="ID" />
                </DatagridConfigurable>
            </List >
        if (widget.query === 'dj-queries')
            return <List
                perPage={listParams?.perPage ? listParams?.perPage : undefined}
                sort={listParams?.sort ? listParams?.sort : undefined}
                filterDefaultValues={listParams?.filterValues ? listParams?.filterValues : undefined}
                actions={<Actions />} filters={[
                    /* eslint-disable */
                    <TextInput source="ID"></TextInput>,
                    <TextInput source="database"></TextInput>,
                    <TextInput source="query"></TextInput>,
                    <TextInput source="comment"></TextInput>,
                    <TextInput source="type"></TextInput>,
                    <TextInput source="roles"></TextInput>,
                    /* eslint-enable */
                ]}>
                <ListContextListener />
                <DatagridConfigurable
                    sx={{
                        "& .RaDatagrid-rowCell": {
                            whiteSpace: "nowrap",
                            maxWidth: '300px',
                            overflowX: 'hidden'
                        },
                        "& .RaDatagrid-headerCell": {
                            whiteSpace: "nowrap",
                        },
                    }}
                >
                    <ReferenceField source="ID" reference="config/dj-query-catalog" />
                    <TextField source="database" />
                    <TextField source="query" />
                    <TextField source="comment" />
                    <TextField source="type" />
                    <TextField source="roles" />
                    <FunctionField label="Used By" render={(record: any) => lookup[record.ID]?.usedBy} />
                </DatagridConfigurable>
            </List >
        if (widget.query === 'dj-databases-no-config')
            return <List
                perPage={listParams?.perPage ? listParams?.perPage : undefined}
                sort={listParams?.sort ? listParams?.sort : undefined}
                filterDefaultValues={listParams?.filterValues ? listParams?.filterValues : undefined}
                disableSyncWithLocation filters={[
                    /* eslint-disable */
                    <TextInput source="url"></TextInput>,
                    <TextInput source="username"></TextInput>,
                    <TextInput source="status"></TextInput>,
                    /* eslint-enable */
                ]} actions={<Actions />} queryOptions={{ meta: { postCallFilter: (record: any) => record.ID !== 'dj/config' } }} >
                <ListContextListener />
                <DatagridConfigurable
                    sx={{
                        "& .RaDatagrid-rowCell": {
                            whiteSpace: "nowrap",
                            maxWidth: '300px',
                            overflowX: 'hidden'
                        },
                        "& .RaDatagrid-headerCell": {
                            whiteSpace: "nowrap",
                        },
                    }}
                >
                    <LinkField source="ID" />
                    <TextField source="url" />
                    <TextField source="username" />
                    <TextField source="status" />
                    <FunctionField label="Tables" render={(record: any) => (lookup[record.ID])?.tables} />
                </DatagridConfigurable>
            </List >
        if (widget.query === 'dj-config-values')
            return <List
                perPage={listParams?.perPage ? listParams?.perPage : undefined}
                sort={listParams?.sort ? listParams?.sort : undefined}
                filterDefaultValues={listParams?.filterValues ? listParams?.filterValues : undefined}
                disableSyncWithLocation filters={[
                    /* eslint-disable */
                    <TextInput source="ID"></TextInput>,
                    <TextInput source="description"></TextInput>,
                    <TextInput source="category"></TextInput>,
                    /* eslint-enable */
                ]} actions={<Actions />} >
                <DatagridConfigurable
                    sx={{
                        "& .RaDatagrid-rowCell": {
                            whiteSpace: "nowrap",
                            maxWidth: '300px',
                            overflowX: 'hidden'
                        },
                        "& .RaDatagrid-headerCell": {
                            whiteSpace: "nowrap",
                        },
                    }}
                >
                    <ReferenceField source="ID" reference="config/dj-config" />
                    <FunctionField label="Value" render={(record: any) => {
                        if (record.type === 'password')
                            return record[record.type] ? '********' : record[record.type]
                        if (record[record.type] === true)
                            return 'true'
                        if (record[record.type] === false)
                            return 'false'
                        return util.isObject(record[record.type]) || util.isTable(record[record.type]) ? util.stringify(record[record.type]) : record[record.type]
                    }} />
                    <TextField source="category" />
                    <TextField source="description" />
                </DatagridConfigurable>
            </List >
    }

    // schema (query metadata) is returned by useQuery
    return <Value data={data!.data} schema={data!.schema} resource={widget.query + (args ? JSON.stringify(args) : '')} perPage={widget.perPage}></Value>
}

const LinkField = (props: any) => {
    const record = useRecordContext()
    if (record.ID.startsWith('dj/'))
        return <Link to={'/config/dj-database/' + encodeURIComponent(record.ID)}>{record.name}</Link>
    else
        return <Link to={'/page/' + encodeURIComponent(record.ID)}>{'/page/' + record.ID}</Link>
}

export const GraphQueryTable = ({ widget, args }: { widget: Widget, args?: any }) => {

    // db query
    const { data, isLoading, error } = useGraphQuery(widget.database!, widget.query!, args)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <Value data={data} resource={widget.query} schema={util.inferSchemaFromData(data)} perPage={widget.perPage} />
}

export const SearchTable = ({ widget }: { widget: Widget }) => {
    // search
    const loc = useLoc()
    const { data, isLoading, error } = useSearch(loc)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // modify result to generate link column
    const tmp = data.map((row: SearchResult) => {
        return {
            url: row.id,
            database: row.id.database,
            table: row.id.table,
            column: row.column,
            match: row.match,
        }
    })

    // infer schema
    return <Value data={tmp} schema={util.inferSchemaFromData(tmp)} resource={'search'} perPage={widget.perPage}></Value>
}

export const AllTable = ({ widget }: { widget: Widget }) => {
    // db table
    // schema is table schema
    const loc = useLoc()
    let { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table) });

    // get a sample because there might be columns for which we do not have a schema
    const sample = useGetList(util.toResource(loc), { pagination: { page: 1, perPage: 10 } })

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (sample.isLoading) return <Loading />
    if (sample.error) return <PrintError error={sample.error}></PrintError>

    const sampleSchema = util.inferSchemaFromData(sample.data!)

    // add missing columns
    for (const [k, v] of Object.entries(sampleSchema.properties ? sampleSchema.properties : {}))
        if (!data.properties[k]) {
            // make sure to leave the original object unchanged
            data = { ...data }
            data.properties = { ...data.properties }
            data.properties[k] = v
        }

    // widget restricts columns to display
    if (Array.isArray(widget.columns) && widget.columns.length > 0) {
        const projected = { properties: {} as any }
        for (const col of widget.columns)
            if (data.properties[col])
                projected.properties[col] = data.properties[col]
        data = projected
    }

    return <MyListGuesser schema={data} selectable={true} allTable={true} perPage={widget.perPage} bulkActionButtons={widget.deleteConfirmation ? <BulkDeleteButton mutationMode="pessimistic" /> : undefined} />
}

/**
 * special feature so we can bulk run functions
 */
const BulkRun = () => {
    const { selectedIds } = useListContext();
    const dataProvider = useDataProvider()
    const notify = useNotify()
    const refresh = useRefresh()
    const resource = useResourceContext()
    const unselectAll = useUnselectAll(resource);

    return <Button label="Run" onClick={async _ => {
        try {
            notify('Starting...')
            for (const id of selectedIds)
                await dataProvider.expression('$call(id)', { id })
            notify('Ok')
        }
        catch (err) {
            notify(util.error(err), { type: 'error' })
            return
        }
        unselectAll()
        refresh()
    }}><Icon>play_circle</Icon></Button>
}

export default Table

export const config = {
    id: 'table',
    title: 'Table',
    description: 'Show query, expression, or search result in table',
    version: 1,
    icon: <Icon>table</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                database: database,
                query: query,
                graph: graph,
                expression: expression,
                arguments: _arguments,
                perPage: perPage
            }
        }
    }
}