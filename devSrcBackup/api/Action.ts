import jsonata from "jsonata"
import { util } from "./Util"
import { api } from "./Api"
import { profile } from "./Profile"

/**
 * the list of JSONata UI actions
 */
export const actions: {
    [key: string]: ActionImpl
} = {
    // confirm yielding true / false
    confirm: {
        client: true,
        run: (message: string) => window.confirm(message),
        preview: () => true
    },

    // clear cache after jsonata / query update
    clearCache: {
        client: true,
        run: () => api.clearCache(),
        preview: () => { }
    },

    // set session var
    setVariable: {
        client: true,
        run: (key: string, value: any) => {
            const x = profile.getVariable()
            if (value === undefined)
                delete x[key]
            else
                x[key] = value
            profile.setVariable(x)
        },
        preview: (key: string, value: any) => console.log('setVariable', key, value)
    },

    // get a user input, in preview mode, use an optional default value
    prompt: {
        client: true,
        run: (title: string) => prompt(title),
        preview: (title: string, def: string) => def
    },

    // display alert, console.log in preview
    alert: {
        client: true,
        run: (value: any) => {
            alert(util.stringify(value))
        },
        preview: (value: any) => {
            console.log('alert', value)
        },
    },

    // text 2 speech, console.log in preview
    speak: {
        client: true,
        run: (text: string, lang?: string) => {
            const utter = new SpeechSynthesisUtterance()
            utter.text = text
            utter.lang = lang ? lang : util.detectLanguage(text)
            window.speechSynthesis.speak(utter)
        },
        preview: (text: string, lang?: string) => {
            console.log('speak', text, lang ? lang : util.detectLanguage(text))
        },
    },

    // cancel speech output, console.log in preview
    stopSpeech: {
        client: true,
        run: () => {
            window.speechSynthesis.cancel()
        },
        preview: () => {
            console.log('stopSpeech')
        },
    },

    // show value using useNotify hook
    notify: {
        client: true,
        run: (notify: any) => (value: any) => notify(util.stringify(value))
    },

    // userefresh
    refresh: {
        client: true,
        run: (refresh: any) => () => refresh()
    },

    // reload page
    reload: {
        client: true,
        run: () => window.location.reload(),
        preview: () => console.log('reload')
    },

    // console.log
    log: {
        client: true,
        run: console.log
    },

    // navigate
    navigate: {
        client: true,
        run: (navigate: any) => (url: any) => {
            if (!url)
                throw new Error("Syntax: $navigate(url | {database, table, pk1})")
            if (typeof url === 'string')
                if (url.startsWith('http'))
                    window.location.href = url
                else
                    navigate(url)
            else
                navigate('/' + url.database + '/' + encodeURIComponent(url.table) + '/' + encodeURIComponent(url.pk1))
        },
        preview: (url: any) => {
            console.log('navigate', url)
        },
    },

    // proxy all other custom functions
    gitRestore: {
        run: (path: string) => api.expression('$gitRestore(path)', { path }),
        preview: (path: string) => api.expressionPreview('$gitRestore(path)', { path }, false)
    },

    gitCommit: {
        run: (message: string, paths: string[]) => api.expression('$gitCommit(message, paths)', { message, paths }),
        preview: (message: string, paths: string[]) => api.expressionPreview('$gitCommit(message, paths)', { message, paths }, false),
    },

    djSubscription: {
        run: () => api.expression('$djSubscription()', {}),
        preview: () => api.expressionPreview('$djSubscription()', {}, false),
    },

    djVersion: {
        run: () => api.expression('$djVersion()', {}),
        preview: () => api.expressionPreview('$djVersion()', {}, false),
    },

    djGetFunctions: {
        run: () => api.expression('$djGetFunctions()', {}),
        preview: () => api.expressionPreview('$djGetFunctions()', {}, false),
    },

    djGetDatabases: {
        run: () => api.expression('$djGetDatabases()', {}),
        preview: () => api.expressionPreview('$djGetDatabases()', {}, false),
    },

    djGetDrivers: {
        run: () => api.expression('$djGetDrivers()', {}),
        preview: () => api.expressionPreview('$djGetDrivers()', {}, false),
    },

    djUser: {
        run: () => api.expression('$djUser()', {}),
        preview: () => api.expressionPreview('$djUser()', {}, false),
    },

    djRoles: {
        run: () => api.expression('$djRoles()', {}),
        preview: () => api.expressionPreview('$djRoles()', {}, false),
    },

    call: {
        run: (name: string, args: any) => api.expression('$call(name, args)', { name, args }),
        preview: (name: string, args: any) => api.expressionPreview('$call(name, args)', { name, args }, false),
    },

    search: {
        run: (term: string, limit: number, db: string, table: string) => api.expression('$search(term, limit, db, table)', { term, limit, db, table }),
        preview: (term: string, limit: number, db: string, table: string) => api.expressionPreview('$search(term, limit, db, table)', { term, limit, db, table }, false),
    },

    echo: {
        run: (message: string) => api.expression('$echo(message)', { message }),
        preview: (message: string) => api.expressionPreview('$echo(message)', { message }, false),
    },

    collectMetadata: {
        run: (db: string) => api.expression('$collectMetadata(db)', { db }),
        preview: (db: string) => api.expressionPreview('$collectMetadata(db)', { db }, false),
    },

    alterTable: {
        run: (args: any) => api.expression('$alterTable(args)', args),
        preview: (args: any) => api.expressionPreview('$alterTable(args)', args, false),
    },

    alterColumn: {
        run: (args: any) => api.expression('$alterColumn(args)', args),
        preview: (args: any) => api.expressionPreview('$alterColumn(args)', args, false),
    },

    alterTableTrigger: {
        run: (args: any) => api.expression('$alterTableTrigger(args)', args),
        preview: (args: any) => api.expressionPreview('$alterTableTrigger(args)', args, false),
    },

    alterColumnTrigger: {
        run: (args: any) => api.expression('$alterColumn(args)', args),
        preview: (args: any) => api.expressionPreview('$alterColumn(args)', args, false),
    },

    crawl: {
        run: (url: string) => api.expression('$crawl(url)', { url }),
        preview: (url: string) => api.expressionPreview('$crawl(url)', { url }, false),
    },

    doc2data: {
        run: (url: string) => api.expression('$doc2data(url)', { url }),
        preview: (url: string) => api.expressionPreview('$doc2data(url)', { url }, false),
    },

    index: {
        run: () => api.expression('$index()', {}),
        preview: () => api.expressionPreview('$index()', {}, false)
    },

    etlSync: {
        run: (source: string, target: string, column: string, del?: boolean) => api.expression('$etlSync(source, target, column, del)', { source, target, column, del }),
        preview: (source: string, target: string, column: string, del?: boolean) => api.expressionPreview('$etlSync(source, target, column, del)', { source, target, column, del }, false),
    },

    uuid: {
        run: () => api.expression('$uuid()', {}),
        preview: () => api.expressionPreview('$uuid()', {}, false),
    },

    createStubs: {
        run: () => api.expression('$createStubs()', {}),
        preview: () => api.expressionPreview('$createStubs()', {}, false),
    },

    gitPull: {
        run: () => api.expression('$gitPull()', {}),
        preview: () => api.expressionPreview('$gitPull()', {}, false),
    },

    gitStatus: {
        run: () => api.expression('$gitStatus()', {}),
        preview: () => api.expressionPreview('$gitStatus()', {}, false),
    },

    gitClone: {
        run: (url: string) => api.expression('$gitClone(url)', { url }),
        preview: (url: string) => api.expressionPreview('$gitClone()', { url }, false),
    },

    urlExists: {
        run: (url: string) => api.expression('$urlExists(url)', { url }),
        preview: (url: string) => api.expressionPreview('$urlExists()', { url }, false),
    },

    saveTable: {
        run: (mode: string, db: string, table: string, id: string) => api.expression('$saveTable(mode, db,table, id)', { mode, db, table, id }),
        preview: (mode: string, db: string, table: string, id: string) => api.expressionPreview('$saveTable(mode, db,table, id)', { mode, db, table, id }, false),
    },

    saveApi: {
        run: () => api.expression('$saveApi()', {}),
        preview: () => api.expressionPreview('$saveApi()', {}, false),
    },

    erDiagram: {
        run: () => api.expression('$erDiagram()', {}),
        preview: () => api.expressionPreview('$erDiagram()', {}, false),
    },

    stats: {
        run: (db: string, table: string, limit: number) => api.expression('$stats(db, table, limit)', { db, table, limit }),
        preview: (db: string, table: string, limit: number) => api.expressionPreview('$stats(db, table, limit)', { db, table, limit }, false),
    },

    isRecursiveTrigger: {
        run: () => api.expression('$isRecursiveTrigger()', {}),
        preview: () => api.expressionPreview('$isRecursiveTrigger()', {}, false),
    },

    moveField: {
        run: (object: any, from: string, to: string, newname: string) => api.expression('$moveField(object, from, to, newname)', { object, from, to, newname }),
        preview: (object: any, from: string, to: string, newname: string) => api.expressionPreview('$moveField(object, from, to, newname)', { object, from, to, newname }, false),
    },

    exec: {
        run: (script: string, args: any, format: string) => api.expression('$exec(script, args, format)', { script, args, format }),
        preview: (script: string, args: any, format: string) => api.expressionPreview('$exec(script, args, format)', { script, args, format }, false),
    },

    createTable: {
        run: (db: string, table: string) => api.expression('$createTable(db, table)', { db, table }),
        preview: (db: string, table: string) => api.expressionPreview('$createTable(db, table)', { db, table }, false),
    },

    streamdata: {
        run: () => { throw new Error('streamdata is deprecated') },
        preview: () => { throw new Error('streamdata is deprecated') },
    },

    ls: {
        run: () => { throw new Error('ls is deprecated') },
        preview: () => { throw new Error('ls is deprecated') },
    },

    streamJson: {
        run: () => { throw new Error('function can only be used for ETL expressions') },
        preview: () => { throw new Error('function can only be used for ETL expressions') },
    },

    streamXml: {
        run: () => { throw new Error('function can only be used for ETL expressions') },
        preview: () => { throw new Error('function can only be used for ETL expressions') },
    },

    streamCsv: {
        run: () => { throw new Error('function can only be used for ETL expressions') },
        preview: () => { throw new Error('function can only be used for ETL expressions') },
    },

    streamDb: {
        run: () => { throw new Error('function can only be used for ETL expressions') },
        preview: () => { throw new Error('function can only be used for ETL expressions') },
    },

    openJson: {
        run: (url: string) => api.expression('$openJson(url)', { url }),
        preview: (url: string) => api.expressionPreview('$openJson(url)', { url }, false),
    },

    curl: {
        run: (method: string, url: string, data: any, headers: any) => api.expression('$curl(method, url, data, headers)', { method, url, data, headers }),
        preview: (method: string, url: string, data: any, headers: any) => api.expressionPreview('$curl(method, url, data, headers)', { method, url, data, headers }, false),
    },

    parseJson: {
        run: (url: string) => api.expression('$parseJson(url)', { url }),
        preview: (url: string) => api.expressionPreview('$parseJson(url)', { url }, false),
    },

    wait: {
        run: (delay: number) => api.expression('$wait(delay)', { delay }),
        preview: (delay: number) => api.expressionPreview('$wait(delay)', { delay }, false),
    },

    openCsv: {
        run: (url: string, mode: string) => api.expression('$openCsv(url, mode)', { url, mode }),
        preview: (url: string, mode: string) => api.expressionPreview('$openCsv(url, mode)', { url, mode }, false),
    },

    parseCsv: {
        run: (url: string, mode: string) => api.expression('$parseCsv(url, mode)', { url, mode }),
        preview: (url: string, mode: string) => api.expressionPreview('$parseCsv(url, mode)', { url, mode }, false),
    },

    openXml: {
        run: (url: string, arrays: string[]) => api.expression('$openXml(url, arrays)', { url, arrays }),
        preview: (url: string, arrays: string[]) => api.expressionPreview('$openXml(url, arrays)', { url, arrays }, false),
    },

    openYaml: {
        run: (url: string) => api.expression('$openYaml(url)', { url }),
        preview: (url: string) => api.expressionPreview('$openYaml(url)', { url }, false),
    },

    parseXml: {
        run: (url: string, arrays: string[]) => api.expression('$parseXml(url, arrays)', { url, arrays }),
        preview: (url: string, arrays: string[]) => api.expressionPreview('$parseXml(url, arrays)', { url, arrays }, false),
    },

    parseHtml: {
        run: (html: string, query: string, mode: string) => api.expression('$parseHtml(html, query, mode)', { html, query, mode }),
        preview: (html: string, query: string, mode: string) => api.expressionPreview('$parseHtml(html, query, mode)', { html, query, mode }, false),
    },

    parseYaml: {
        run: (url: string) => api.expression('$parseYaml(url)', { url }),
        preview: (url: string) => api.expressionPreview('$parseYaml(url)', { url }, false),
    },

    parseUrl: {
        run: (url: string) => api.expression('$parseUrl(url)', { url }),
        preview: (url: string) => api.expressionPreview('$parseUrl(url)', { url }, false),
    },

    openExcel: {
        run: (url: string) => api.expression('$openExcel(url)', { url }),
        preview: (url: string) => api.expressionPreview('$openExcel(url)', { url }, false),
    },

    parseExcel: {
        run: (url: string) => api.expression('$parseExcel(url)', { url }),
        preview: (url: string) => api.expressionPreview('$parseExcel(url)', { url }, false),
    },

    openText: {
        run: (url: string) => api.expression('$openText(url)', { url }),
        preview: (url: string) => api.expressionPreview('$openText(url)', { url }, false),
    },

    synonym: {
        run: (alg: string, terms: string[], variants: string[], ignoreCase: boolean, ignoreEquality: boolean) =>
            api.expression('$synonym(alg, terms, variants, ignoreCase, ignoreEquality)', { alg, terms, variants, ignoreCase, ignoreEquality }),
        preview: (alg: string, terms: string[], variants: string[], ignoreCase: boolean, ignoreEquality: boolean) =>
            api.expressionPreview('$synonym(alg, terms, variants, ignoreCase, ignoreEquality)', { alg, terms, variants, ignoreCase, ignoreEquality }, false),
    },

    reconcileEntity: {
        run: (entity: string, language: string, limit: number) => api.expression('$reconcileEntity(entity, language, limit)', { entity, language, limit }),
        preview: (entity: string, language: string, limit: number) => api.expressionPreview('$reconcileEntity(entity, language, limit)', { entity, language, limit }, false),
    },

    classifyEntities: {
        run: (entities: string[], language: string, limit: number, depth: number) => api.expression('$classifyEntities(entities, language, limit, depth)', { entities, language, limit, depth }),
        preview: (entities: string[], language: string, limit: number, depth: number) => api.expressionPreview('$classifyEntities(entities, language, limit, depth)', { entities, language, limit, depth }, false),
    },

    read: {
        run: (db: string, table: string, id: any) => api.expression('$read(db, table, id)', { db, table, id }),
        preview: (db: string, table: string, id: any) => api.expressionPreview('$read(db, table, id)', { db, table, id }, false),
    },

    incoming: {
        run: (db: string, table: string, id: any) => api.expression('$incoming(db, table, id)', { db, table, id }),
        preview: (db: string, table: string, id: any) => api.expressionPreview('$incoming(db, table, id)', { db, table, id }, false),
    },

    delete: {
        run: (db: string, table: string, id: any) => api.expression('$delete(db, table, id)', { db, table, id }),
        preview: (db: string, table: string, id: any) => api.expressionPreview('$delete(db, table, id)', { db, table, id }, false),
    },

    traverse: {
        run: (db: string, table: string, id: any, fk: string) => api.expression('$traverse(db, table, id, fk)', { db, table, id, fk }),
        preview: (db: string, table: string, id: any, fk: string) => api.expressionPreview('$traverse(db, table, id, fk)', { db, table, id, fk }, false),
    },

    create: {
        run: (db: string, table: string, object: any) => api.expression('$create(db, table, object)', { db, table, object }),
        preview: (db: string, table: string, object: any) => api.expressionPreview('$create(db, table, object)', { db, table, object }, false),
    },

    upsert: {
        run: (db: string, table: string, object: any) => api.expression('$upsert(db, table, object)', { db, table, object }),
        preview: (db: string, table: string, object: any) => api.expressionPreview('$upsert(db, table, object)', { db, table, object }, false),
    },

    update: {
        run: (db: string, table: string, id: string, object: any) => api.expression('$update(db, table, id, object)', { db, table, id, object }),
        preview: (db: string, table: string, id: string, object: any) => api.expressionPreview('$update(db, table, id, object)', { db, table, id, object }, false),
    },

    adHocQuery: {
        run: (db: string, query: string, limit: number) => api.expression('$adHocQuery(db, query, limit)', { db, query, limit }),
        preview: (db: string, query: string, limit: any) => api.expressionPreview('$adHocQuery(db, query, limit)', { db, query, limit }, false),
    },

    adHocQueryGraph: {
        run: (db: string, query: string, limit: number) => api.expression('$adHocQueryGraph(db, query, limit)', { db, query, limit }),
        preview: (db: string, query: string, limit: any) => api.expressionPreview('$adHocQueryGraph(db, query, limit)', { db, query, limit }, false),
    },

    query: {
        run: (db: string, query: string, args: any) => api.expression('$query(db, query, args)', { db, query, args }),
        preview: (db: string, query: string, args: any) => api.expressionPreview('$query(db, query, args)', { db, query, args }, false),
    },

    queryGraph: {
        run: (db: string, query: string, args: any) => api.expression('$queryGraph(db, query, args)', { db, query, args }),
        preview: (db: string, query: string, args: any) => api.expressionPreview('$queryGraph(db, query, args)', { db, query, args }, false),
    },

    all: {
        run: (db: string, table: string, offset: number, limit: number, sort: string, desc: boolean, args: any) => api.expression('$all(db, table, offset, limit, sort, desc, args)', { db, table, offset, limit, sort, desc, args }),
        preview: (db: string, table: string, offset: number, limit: number, sort: string, desc: boolean, args: any) => api.expressionPreview('$all(db, table, offset, limit, sort, desc, args)', { db, table, offset, limit, sort, desc, args }, false),
    },

    etl: {
        run: (foreach: string, expression: string, db: string, mappings: any, oldData: string, createSchema: boolean, ignoreErrors: boolean, workerThreads: number) => api.expression('$etl(foreach, expression, db, mappings, oldData, createSchema, ignoreErrors, workerThreads)', { foreach, expression, db, mappings, oldData, createSchema, ignoreErrors, workerThreads }),
        preview: (foreach: string, expression: string, db: string, mappings: any, oldData: string, createSchema: boolean, ignoreErrors: boolean, workerThreads: number) => api.expressionPreview('$etl(foreach, expression, db, mappings, oldData, createSchema, ignoreErrors, workerThreads)', { foreach, expression, db, mappings, oldData, createSchema, ignoreErrors, workerThreads }, false)
    }
}

class Action {
    /**
     * check the expression and determine whether is runs on the frontend or the backend
     */
    isAction(expr: string): boolean {
        for (const [k, v] of Object.entries(actions))
            if (v.client)
                if (expr.includes('$' + k + '('))
                    return true
        return false
    }

    /**
     * register the implementations
     */
    register(expression: string, preview: boolean, notify: any, refresh: any, navigate: any): jsonata.Expression {
        const expr = jsonata(expression)
        for (const [name, impl] of Object.entries(actions))
            if (name === 'notify')
                expr.registerFunction(name, impl.run(notify))
            else if (name === 'refresh')
                expr.registerFunction(name, impl.run(refresh))
            else if (name === 'navigate')
                expr.registerFunction(name, preview ? impl.preview : impl.run(navigate))
            else
                expr.registerFunction(name, preview && impl.preview ? impl.preview : impl.run)
        return expr
    }
}

export const action = new Action()

interface ActionImpl {
    run: any
    preview?: any
    client?: boolean
}
