import { CreateParams, CreateResult, DataProvider, DeleteManyParams, DeleteManyResult, DeleteParams, DeleteResult, GetListParams, GetListResult, GetManyParams, GetManyReferenceParams, GetManyReferenceResult, GetManyResult, GetOneParams, GetOneResult, RaRecord, UpdateManyParams, UpdateManyResult, UpdateParams, UpdateResult } from "ra-core"
import { api } from "./Api"
import { Result } from "../model/result"
import { AddColumnRequest, DistinctRequest, MoveColumnRequest, QueryDatabase, QueryResponse, RemoveColumnRequest, RenameRequest, SetWhereRequest, SortRequest } from "../model/model"
import { util } from "./Util"
import { DJDataGetOptions } from "../model/DJDataGetOptions"
import { action } from "./Action"
import { render } from "./Render"

/**
 * RA data provider for the dashjoin backend
 */
export const dataProvider: DataProvider = {
    incoming: (database: string, table: string, id: any, offset?: number, limit?: number) => {
        return api.incoming(database, table, id, offset, limit)
    },
    incomingComp: (database: string, table: string, ids: any[], offset?: number, limit?: number) => {
        return api.incomingComp(database, table, ids, offset, limit)
    },
    get: (url: string) => {
        return api.get(url)
    },
    post: (url: string, args: any) => {
        return api.post(url, args)
    },
    postCached: (url: string, args: any) => {
        return api.postCached(url, args)
    },
    expression: (e: string, d: any) => {
        return api.expression(e, d)
    },
    expressionCached: (e: string, d: any) => {
        return api.expressionCached(e, d)
    },
    expressionPreview: (e: string, d: any, foreach: boolean) => {
        return api.expressionPreview(e, d, foreach)
    },
    action: (e: string, d: any, notify: any, refresh: any, navigate: any) => {
        try {
            const expr = action.register(e, false, notify, refresh, navigate)
            return expr.evaluate(d).catch(error => {
                throw new Error(util.error(error))
            })
        } catch (err) {
            return Promise.reject(err)
        }
    },
    actionPreview: (e: string, d: any, foreach: boolean, notify: any, refresh: any, navigate: any) => {
        try {
            const expr = action.register(e, true, notify, refresh, navigate)
            return expr.evaluate(d).catch(error => {
                throw new Error(util.error(error))
            })
        } catch (err) {
            return Promise.reject(err)
        }
    },
    keys: (database: string, table: string, prefix: string) => {
        return api.keys(database, table, prefix)
    },
    tables: () => {
        return api.tables()
    },
    tableLabels: () => {
        return api.tableLabels()
    },

    query: (database: string, query: string, args?: any) => {
        return api.query(database, query, args)
    },

    queryGraph: (database: string, query: string, args?: any) => {
        return api.queryGraph(database, query, args)
    },

    queryMeta: (database: string, query: string, args?: any) => {
        return api.queryMeta(database, query, args)
    },

    queryCached: (database: string, query: string, args?: any) => {
        return api.queryCached(database, query, args)
    },

    queryGraphCached: (database: string, query: string, args?: any) => {
        return api.queryGraphCached(database, query, args)
    },

    queryMetaCached: (database: string, query: string, args?: any) => {
        return api.queryMetaCached(database, query, args)
    },

    search: (search: string, database?: string, table?: string) => {
        return api.search(search, database, table)
    },

    getList: async function <RecordType extends RaRecord = any>(resource: string, params: GetListParams): Promise<GetListResult<RecordType>> {

        const [database, table] = util.parseResource(resource)
        if (params.meta?.keys) {
            const ids = (await this.keys(database, table, params.filter.q))
                .map((key: any) => key.value)
            return this.getList(resource, {
                filter: { ids },
                sort: { field: 'id', order: 'ASC' },
                pagination: { page: 1, perPage: 25 }
            })
        }
        const hasColumnCalledId = await api.hasColumnCalledId(database, table)
        const pars: DJDataGetOptions = (params.sort.field === 'id' && !hasColumnCalledId) ? {} : { sort: { field: params.sort.field, order: params.sort.order === 'ASC' ? 'asc' : 'desc' } }
        if (params.filter)
            pars.arguments = params.filter
        pars.pageSize = params.pagination.perPage
        pars.cursor = params.pagination.page - 1
        let json = params.filter?.ids ? await api.list(database, table, params.filter.ids).then(x => Object.values(x)) :
            await api.all(database, table, pars)

        util.samples[resource] = json

        await api.ids(database, table, json)

        // special case: filter out config DB
        if (params.meta?.postCallFilter)
            json = json.filter(params.meta?.postCallFilter)

        const from = (params.pagination.page - 1) * params.pagination.perPage
        if (json.length < params.pagination.perPage)
            return {
                data: json as any,
                total: from + json.length
            };
        else {
            let hasNextPage = true
            if (params.pagination.page > 1)
                if (!params.filter?.ids) {
                    // the user started paging, we prefetch the next page in order to determine 
                    // whether we're right on the pagination mark
                    pars.cursor = pars.cursor + 1
                    const next = await api.all(database, table, pars)
                    if (next.length === 0)
                        hasNextPage = false
                }
            return {
                data: json as any,
                pageInfo: {
                    hasPreviousPage: params.pagination.page > 1,
                    hasNextPage
                }
            }
        }
    },
    getOne: async function <RecordType extends RaRecord = any>(resource: string, params: GetOneParams<any>): Promise<GetOneResult<RecordType>> {

        const [database, table] = util.parseResource(resource)

        // RA does not support composite keys
        const pks = (await api.pks(database, table))
        const composite = pks.length > 1

        // wrap single result in table so we can reuse api.ids
        const json = composite
            ? [await api.readComp(database, table, params.id.split('_')) as any]
            : [await api.read(database, table, params.id) as any]
        await api.ids(database, table, json)

        return {
            data: json[0]
        };
    },
    getMany: async function <RecordType extends RaRecord = any>(resource: string, params: GetManyParams): Promise<GetManyResult<RecordType>> {
        const [database, table] = util.parseResource(resource)
        const json = Object.values(await api.list(database, table, params.ids))
        await api.ids(database, table, json)
        return {
            data: json as any
        }
    },
    getManyReference: async function <RecordType extends RaRecord = any>(resource: string, params: GetManyReferenceParams): Promise<GetManyReferenceResult<RecordType>> {

        const [database, table] = util.parseResource(resource)
        const json = await api.all(database, table, params.sort.field === 'id' ? {
            arguments: {
                [params.target]: params.id
            },
            pageSize: params.pagination.perPage,
            cursor: params.pagination.page - 1
        } :
            {
                sort: {
                    field: params.sort.field, order: params.sort.order === 'ASC' ? 'asc' : 'desc'
                },
                arguments: {
                    [params.target]: params.id
                },
                pageSize: params.pagination.perPage,
                cursor: params.pagination.page - 1
            })
        await api.ids(database, table, json)

        const from = (params.pagination.page - 1) * params.pagination.perPage
        if (json.length < params.pagination.perPage)
            return {
                // TODO: push paging to API call and use pageInfo instead of total
                data: json as any,
                total: from + json.length
            };
        else
            return {
                data: json as any,
                pageInfo: {
                    hasPreviousPage: params.pagination.page > 1,
                    hasNextPage: true
                }
            }
    },
    update: async function <RecordType extends RaRecord = any>(resource: string, params: UpdateParams<any>): Promise<UpdateResult<RecordType>> {
        const [database, table] = util.parseResource(resource)
        const clone = { ...params.data }
        delete clone.id
        // RA does not support composite keys
        const pks = (await api.pks(database, table))
        const composite = pks.length > 1
        composite
            ? await api.updateComp(database, table, (params.id as any).split('_'), clone)
            : await api.update(database, table, params.id, clone)
        api.clearCache()

        if (resource === 'config/dj-database')
            // rescan database
            render.setDdl()

        return { data: params.data as any }
    },
    updateMany: async function <RecordType extends RaRecord = any>(resource: string, params: UpdateManyParams<any>): Promise<UpdateManyResult<RecordType>> {
        for (const id of params.ids)
            await this.update(resource, { id, data: params.data, previousData: undefined })
        return Promise.resolve({
            data: params.ids
        })
    },
    create: async function <RecordType extends RaRecord = any>(resource: string, params: CreateParams<any>): Promise<CreateResult<RecordType>> {
        const [database, table] = util.parseResource(resource)
        const id = await api.create(database, table, params.data)
        api.clearCache()

        const parsed = id.split('/')
        parsed.shift()
        parsed.shift()
        parsed.shift()

        if (resource === 'config/dj-database')
            // new database
            render.setDdl()
        if (resource === 'config/Table')
            // new table
            render.setDdl()

        return {
            data: {
                id: parsed.join('_')
            } as any
        }
    },
    delete: async function <RecordType extends RaRecord = any>(resource: string, params: DeleteParams<RecordType>): Promise<DeleteResult<RecordType>> {
        const [database, table] = util.parseResource(resource)
        // RA does not support composite keys
        const pks = (await api.pks(database, table))
        const composite = pks.length > 1
        composite
            ? await api.deleteComp(database, table, (params.id as any).split('_'))
            : await api.delete(database, table, params.id)
        api.clearCache()

        if (resource === 'config/dj-database')
            // remove database
            render.setDdl()
        if (resource === 'config/Table')
            // drop table
            render.setDdl()

        return { data: params.previousData as any }
    },
    deleteMany: async function <RecordType extends RaRecord = any>(resource: string, params: DeleteManyParams<RecordType>): Promise<DeleteManyResult<RecordType>> {
        for (const id of params.ids)
            await this.delete(resource, { id })
        return Promise.resolve({
            data: params.ids
        })
    },

    // mapping editor

    gather: (e: string, d: any) => {
        return api.gather(e, d)
    },

    setExpression(data: Result, table: string, column: string, newvalue: any) {
        return api.setExpression(data, table, column, newvalue)
    },

    removeTable(data: Result, table: string) {
        return api.removeTable(data, table)
    },

    removeColumn(data: Result, table: string, column: string) {
        return api.removeColumn(data, table, column)
    },

    renameTable(data: Result, table: string, base: string) {
        return api.renameTable(data, table, base)
    },

    renameColumn(data: Result, table: string, column: string, base: string) {
        return api.renameColumn(data, table, column, base)
    },

    addTable(data: Result, base: string) {
        return api.addTable(data, base)
    },

    addColumn(data: Result, table: string, column: string) {
        return api.addColumn(data, table, column)
    },

    extractTable(data: Result, table: string, column: string) {
        return api.extractTable(data, table, column)
    },

    resetMappings(data: Result) {
        return api.resetMappings(data)
    },

    noop(q: QueryDatabase): Promise<QueryResponse> {
        return api.noop(q)
    },

    sort(q: SortRequest): Promise<QueryResponse> {
        return api.sort(q)
    },

    moveColumn(q: MoveColumnRequest): Promise<QueryResponse> {
        return api.moveColumn(q)
    },

    distinct(q: DistinctRequest): Promise<QueryResponse> {
        return api.distinct(q)
    },

    initialQuery(q: any): Promise<QueryResponse> {
        return api.initialQuery(q)
    },

    rename(q: RenameRequest): Promise<QueryResponse> {
        return api.rename(q)
    },

    qeRemoveColumn(q: RemoveColumnRequest): Promise<QueryResponse> {
        return api.qeRemoveColumn(q)
    },

    setWhere(q: SetWhereRequest): Promise<QueryResponse> {
        return api.setWhere(q)
    },

    setGroupBy(q: SetWhereRequest): Promise<QueryResponse> {
        return api.setGroupBy(q)
    },

    qeAddColumn(q: AddColumnRequest): Promise<QueryResponse> {
        return api.qeAddColumn(q)
    },

    upload(action: string, database: string, formData: FormData) {
        return api.upload(action, database, formData)
    },
}

