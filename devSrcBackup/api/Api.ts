import axios from "axios";
import { setupCache, buildMemoryStorage, AxiosCacheInstance, MemoryStorage } from "axios-cache-interceptor";
import { DJDataGetOptions } from "../model/DJDataGetOptions";
import { Origin } from "../model/origin";
import { Row } from "../model/row";
import { Schema } from "../model/schema";
import { SearchResult } from "../model/search-result";
import { util } from "./Util";
import { Result } from "../model/result";
import { AddColumnRequest, DistinctRequest, MoveColumnRequest, QueryDatabase, QueryResponse, RemoveColumnRequest, RenameRequest, SetWhereRequest } from "../model/model";

/**
 * backend client API
 * 
 * this is the TS client for the backend API plus some
 * convenience functions like schema() which wraps read(config/Table)
 */
export class Api {

    axios: AxiosCacheInstance;

    interceptorId: number;

    constructor() {
        const axiosInstance = axios.create();
        this.interceptorId = axiosInstance.interceptors.request.use(config => {
            // Set Authorization token
            const token = localStorage.getItem("auth-token");
            config.headers.Authorization = token;
            return config;
        });
        // Use axios cache with default config (except for cloneData=true in order to allow clients to change API results without affecting the cached data):
        this.axios = setupCache(axiosInstance, { storage: buildMemoryStorage(true) });
    }

    clearCache() {
        const storage = this.axios.storage as MemoryStorage
        for (const key of Object.keys(storage.data))
            storage.remove(key)
    }

    /**
     * Sets the API endpoint URL
     * @param url 
     */
    setApiEndpoint(url: string) {
        this.axios.defaults = this.axios.defaults || {};
        this.axios.defaults.baseURL = url
    }

    /**
     * Override auth (usually for tests)
     * @param username 
     * @param password 
     */
    setAuthorization(username: string, password: string) {
        this.axios.defaults.auth = {
            username, password
        };
        this.axios.interceptors.request.eject(this.interceptorId);
    }

    /**
     * call database all
     */
    all(database: string, table: string, options: DJDataGetOptions): Promise<Row[]> {
        const url = `/rest/database/crud/${database}/${encodeURIComponent(table)}`
        let queryPar = []

        if (options.cursor !== undefined && options.pageSize !== undefined) {
            queryPar.push('offset=' + (options.cursor * options.pageSize))
            queryPar.push('limit=' + options.pageSize)
        }
        if (options.sort?.field !== undefined) {
            queryPar.push('sort=' + encodeURIComponent(options.sort?.field))
            queryPar.push('descending=' + (options.sort?.order === 'desc'))
        }
        if (options.arguments !== undefined) {
            queryPar.push('arguments=' + encodeURIComponent(JSON.stringify(options.arguments)))
        }

        if (queryPar.length === 0)
            return this.get<Row[]>(url)
        else
            return this.get<Row[]>(url + '?' + queryPar.join('&'))
    }

    /**
     * like read but returns all keys posted
     */
    list(database: string, table: string, ids: any[]): Promise<Row[]> {
        return this.postCached<Row[]>(`/rest/database/list/${database}/${encodeURIComponent(table)}?ignoreMissing=true`, ids.flat())
    }

    /**
     * get the schema from an ID or the current location
     */
    schema(database: string, table: string): Promise<Schema> {
        return this.read('config', 'Table', 'dj/' + database + '/' + util.encodeTableOrColumnName(table)) as any
    }

    /**
     * call database read
     */
    read(database: string, table: string, id: any): Promise<Row> {
        return this.get<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`)
    }

    /**
     * call database read
     */
    readComp(database: string, table: string, ids: any[]): Promise<Row> {
        return this.get<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}/${ids.map(a => encodeURIComponent(a)).join('/')}`)
    }

    /**
     * call database create
     */
    create(database: string, table: string, data: Row) {
        if (database === 'config')
            if (table === 'dj-database') {
                data.ID = 'dj/' + data.name
                if (data.name === 'search' || data.name === 'page' || data.name === 'full')
                    throw new Error('Databases must not be called "search", "page", or "full", since those are restricted URL paths')
            }

        return this.axios.put<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}`, data, {
        }).then(res => res.data).catch(error => {
            throw new Error(util.error(error))
        })
    }

    /**
     * call database update
     */
    update(database: string, table: string, id: any, data: Row) {
        return this.post<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, data)
    }

    /**
     * call database update
     */
    updateComp(database: string, table: string, ids: any[], data: Row) {
        return this.post<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}/${ids.map(a => encodeURIComponent(a)).join('/')}`, data)
    }

    /**
     * call database delete
     */
    delete(database: string, table: string, id: any) {
        return this.axios.delete<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, {
        }).then(res => res.data).catch(error => {
            throw new Error(util.error(error))
        })
    }

    /**
     * call database delete
     */
    deleteComp(database: string, table: string, ids: any[]) {
        return this.axios.delete<Row>(`/rest/database/crud/${database}/${encodeURIComponent(table)}/${ids.map(a => encodeURIComponent(a)).join('/')}`, {
            headers: {
                'Content-type': 'application/json',
                Authorization: 'Basic ' + btoa('admin:djdjdj')
            }
        }).then(res => res.data).catch(error => {
            throw new Error(util.error(error))
        })
    }

    /**
     * get a property
     */
    async property(p: string): Promise<Schema> {
        const prop = util.parseColumnID(p)
        const schema = await this.schema(prop.database, prop.table)
        return schema.properties![prop.property]
    }

    /**
     * get table pks
     */
    async pks(database: string, table: string): Promise<Schema[]> {
        const schema = await this.schema(database, table)
        return Object.values(schema.properties!).filter(p => (util.isValue(p.pkpos) && p.pkpos! >= 0))
    }

    /**
     * does the table have a column called "id"
     */
    async hasColumnCalledId(database: string, table: string): Promise<boolean> {
        const schema = await this.schema(database, table)
        for (const p of Object.values(schema.properties!))
            if (p.name === 'id')
                return true
        return false
    }

    /**
     * gets a list of table IDs
     */
    tables(): Promise<string[]> {
        return this.get<string[]>('/rest/database/tables')
    }

    /**
     * gets a list of table IDs and labels
     */
    tableLabels(): Promise<any> {
        return this.get<any>('/rest/database/tableLabels')
    }

    /**
     * http get
     */
    get<T>(url: string): Promise<T> {
        return this.axios.get<T>(url
        ).then(res => {
            if (res.status === 204)
                return null as any
            return res.data
        }).catch(error => {
            throw new Error(util.error(error))
        })
    }

    /**
     * call expression eval
     */
    expression(expression: string, data: any): Promise<any> {

        if (!expression)
            return Promise.resolve(null)

        // TODO: need to change dj-table-metadata
        if ('$not($contains(pk1, "/config/"))' === expression)
            expression = 'database != "config" or table = "widget"'

        return this.post('/rest/expression', { expression, data })
    }

    expressionCached(expression: string, data: any): Promise<any> {

        if (!expression)
            return Promise.resolve(null)

        // TODO: need to change dj-table-metadata
        if ('$not($contains(pk1, "/config/"))' === expression)
            expression = 'database != "config" or table = "widget"'

        return this.postCached('/rest/expression', { expression, data })
    }

    /**
     * call expression eval
     */
    expressionPreview(expression: string, data: any, foreach: boolean): Promise<any> {

        if (!expression)
            return Promise.resolve(null)

        // TODO: need to change dj-table-metadata
        if ('$not($contains(pk1, "/config/"))' === expression)
            expression = 'database != "config" or table = "widget"'

        return this.post('/rest/expression-preview', { expression, data, foreach })
    }

    keys(database: string, table: string, prefix: string): Promise<any> {
        if (prefix === undefined)
            prefix = ''
        return this.get('/rest/database/keys/' + database + '/' + encodeURIComponent(table) + '?limit=10&prefix=' +
            encodeURIComponent(prefix))
    }

    /**
     * http post
     */
    doPost<T>(url: string, args: any, options?: any): Promise<T> {
        return this.axios.post<T>(url, args, options).then(res => {
            if (res.status === 204)
                return null as any
            return res.data
        }).catch(error => {
            throw new Error(util.error(error))
        })
    }

    postCached<T>(url: string, args: any): Promise<T> {
        return this.doPost(url, args, { cache: { methods: ['post'] } })
    }

    post<T>(url: string, args: any): Promise<T> {
        return this.doPost(url, args)
    }

    /**
     * call query API
     */
    query(database: string, query: string, args?: Row): Promise<Row[]> {
        if (!args) args = {}
        return this.post<Row[]>(`/rest/database/query/${database}/${encodeURIComponent(query)}`, args)
    }

    queryCached(database: string, query: string, args?: Row): Promise<Row[]> {
        if (!args) args = {}
        return this.postCached<Row[]>(`/rest/database/query/${database}/${encodeURIComponent(query)}`, args)
    }

    /**
     * call query API
     */
    queryGraph(database: string, query: string, args?: Row): Promise<Row[]> {
        if (!args) args = {}
        return this.post<Row[]>(`/rest/database/queryGraph/${database}/${encodeURIComponent(query)}`, args)
    }

    queryGraphCached(database: string, query: string, args?: Row): Promise<Row[]> {
        if (!args) args = {}
        return this.postCached<Row[]>(`/rest/database/queryGraph/${database}/${encodeURIComponent(query)}`, args)
    }

    /**
     * call query meta API
     */
    queryMeta(database: string, query: string, args?: Row): Promise<Schema> {
        if (!args) args = {}
        return this.post<any>(`/rest/database/queryMeta/${database}/${encodeURIComponent(query)}`, args).then(
            res => { return { properties: res, type: 'object', name: '' } }
        )
    }

    queryMetaCached(database: string, query: string, args?: Row): Promise<Schema> {
        if (!args) args = {}
        return this.postCached<any>(`/rest/database/queryMeta/${database}/${encodeURIComponent(query)}`, args).then(
            res => { return { properties: res, type: 'object', name: '' } }
        )
    }

    /**
     * global search
     */
    search(search: string, database?: string, table?: string): Promise<SearchResult[]> {
        if (table)
            return this.get<SearchResult[]>(`/rest/database/search/${database}/${encodeURIComponent(table)}/${encodeURIComponent(search)}?limit=100`)
        if (database)
            return this.get<SearchResult[]>(`/rest/database/search/${database}/${encodeURIComponent(search)}?limit=100`)
        return this.get<SearchResult[]>(`/rest/database/search/${encodeURIComponent(search)}?limit=100`)
    }

    /**
     * given a table, create the "id" required for RA
     * 
     * there's an edge case where a table has a non-pk column id
     * in this case, the id column is "hidden" and can only be set
     * upon create
     */
    async ids(database: string, table: string, json: any[]) {
        const pks = (await api.pks(database, table))
        if (pks.length === 1)
            for (const row of json) {
                row.id = row[pks[0].name!]
            }
        else if (pks.length > 1) {
            for (const row of json)
                row.id = pks.map(pk => row[pk.name!]).join('_')
        } else {
            let i = 0
            for (const row of json)
                row.id = i++
        }
    }

    /**
     * call rest / incoming
     */
    incoming(database: string, table: string, id: any, offset?: number, limit?: number): Promise<Origin[]> {
        if (util.isValue(offset) && util.isValue(limit))
            return this.get<Origin[]>('/rest/database/incoming/' + database + '/' + encodeURIComponent(table) + '/' + encodeURIComponent(id) + '?offset=' + offset + '&limit=' + limit)
        else
            return this.get<Origin[]>('/rest/database/incoming/' + database + '/' + encodeURIComponent(table) + '/' + encodeURIComponent(id))
    }

    /**
     * call rest / incoming
     */
    incomingComp(database: string, table: string, ids: any[], offset?: number, limit?: number): Promise<Origin[]> {
        if (util.isValue(offset) && util.isValue(limit))
            return this.get<Origin[]>('/rest/database/incoming/' + database + '/' + encodeURIComponent(table) + '/' + ids.map(a => encodeURIComponent(a)).join('/') + '?offset=' + offset + '&limit=' + limit)
        else
            return this.get<Origin[]>('/rest/database/incoming/' + database + '/' + encodeURIComponent(table) + '/' + ids.map(a => encodeURIComponent(a)).join('/'))
    }


    /**
     * manage / upload
     */
    upload(action: string, database: string, formData: FormData) {
        return this.post('/rest/manage/' + action + '?database=' + database, formData)
    }

    /**
     * mapping editor
     */
    gather(fn: string, config: any): Promise<any> {
        return this.post('/rest/mapping/gather/' + encodeURIComponent(fn), config)
    }

    /**
     * mapping editor
     */
    setExpression(data: Result, table: string, column: string, newvalue: any) {
        table = table ? table : '__empty__';
        column = column ? column : '__empty__';
        return this.post('/rest/mapping/column/' + encodeURIComponent(table) + '/' +
            encodeURIComponent(column) + '/' + encodeURIComponent(newvalue ? newvalue : column), data);
    }

    /**
     * mapping editor
     */
    removeTable(data: Result, table: string) {
        table = table ? table : '__empty__';
        table = table ? table : '__empty__';
        return this.post('/rest/mapping/removeTable/' + encodeURIComponent(table), data);
    }

    /**
     * mapping editor
     */
    removeColumn(data: Result, table: string, column: string) {
        table = table ? table : '__empty__';
        column = column ? column : '__empty__';
        return this.post('/rest/mapping/removeColumn/' + encodeURIComponent(table) + '/' +
            encodeURIComponent(column), data);
    }

    /**
     * mapping editor
     */
    renameTable(data: Result, table: string, base: string) {
        table = table ? table : '__empty__';
        return this.post('/rest/mapping/renameTable/' + encodeURIComponent(table) +
            '/' + encodeURIComponent(base), data);
    }

    /**
     * mapping editor
     */
    renameColumn(data: Result, table: string, column: string, base: string) {
        table = table ? table : '__empty__';
        column = column ? column : '__empty__';
        return this.post('/rest/mapping/renameColumn/' + encodeURIComponent(table) + '/' +
            encodeURIComponent(column) + '/' + encodeURIComponent(base), data);
    }

    /**
     * mapping editor
     */
    addTable(data: Result, base: string) {
        return this.post('/rest/mapping/addTable/' + encodeURIComponent(base) + '/newtable', data);
    }

    /**
     * mapping editor
     */
    extractTable(data: Result, table: string, column: string) {
        table = table ? table : '__empty__';
        column = column ? column : '__empty__';
        return this.post('/rest/mapping/extractTable/' + encodeURIComponent(table) + '/' +
            encodeURIComponent(column), data);
    }

    /**
     * mapping editor
     */
    resetMappings(data: Result) {
        return this.post('/rest/mapping/reset', data);
    }

    /**
     * mapping editor
     */
    addColumn(data: Result, table: string, column: string) {
        table = table ? table : '__empty__';
        column = column ? column : '__empty__';
        return this.post('/rest/mapping/addColumn/' + encodeURIComponent(table) + '/' + encodeURIComponent(column), data);
    }

    /**
     * query editor
     */
    noop(q: QueryDatabase): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/noop', q)
    }

    /**
     * query editor
     */
    sort(q: QueryDatabase): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/sort', q)
    }

    /**
     * query editor
     */
    moveColumn(q: MoveColumnRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/moveColumn', q)
    }

    /**
     * query editor
     */
    distinct(q: DistinctRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/distinct', q)
    }

    /**
     * query editor
     */
    initialQuery(q: any): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/getInitialQuery', q)
    }

    /**
     * query editor
     */
    rename(q: RenameRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/rename', q)
    }

    /**
     * query editor
     */
    qeRemoveColumn(q: RemoveColumnRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/removeColumn', q)
    }

    /**
     * query editor
     */
    setWhere(q: SetWhereRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/setWhere', q)
    }

    /**
     * query editor
     */
    setGroupBy(q: SetWhereRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/setGroupBy', q)
    }

    /**
     * query editor
     */
    qeAddColumn(q: AddColumnRequest): Promise<QueryResponse> {
        return this.post('/rest/queryeditor/addColumn', q)
    }
}

export const api = new Api()
