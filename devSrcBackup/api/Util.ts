import { Cell, Value, Row as R } from "@react-page/editor";
import jsonata from "jsonata";
import React from "react";
import { Db, Prop, Tbl } from "../model/prop";
import { Row } from "../model/row";
import { Schema } from "../model/schema";
import { Widget } from "../model/widget";
import { saveAs } from 'file-saver-es';
import { Loc } from "../model/loc";
import { Resource } from "../model/resource";
import { widget as w } from "./Const";
import PubSub from 'pubsub-js';
import { profile } from "./Profile";
import LanguageDetect from "languagedetect";

/**
 * various utility functions
 */
export class Util {

    detectLanguage(text: string) {
        const lngDetector = new LanguageDetect()
        lngDetector.setLanguageType("iso2")
        let lang = "en-us";
        try {
            lang = lngDetector.detect(text)[0][0];
        } catch (ignore) { }
        return lang
    }

    /**
     * get the label for a prop
     */
    title(schema: Schema) {
        return schema.title ? schema.title : schema.name
    }

    /**
     * sample data for resources
     */
    samples: { [key: string]: any } = {}

    /**
     * get sample data for resource's column / key
     * 
     * unique
     * filter empty / null
     * sort
     * convert to choice object (name, id)
     */
    getSamples(resource: string, key: string, current: any) {
        let x = this.samples[resource]
        current = current ? current : {}
        if (x)
            x = [current, ...x]
        else
            x = [current]
        return [...new Set(x.map((row: any) => row[key]))].filter(row => row ? true : false).sort().map(row => { return { id: row, name: row } })
    }

    /**
     * flag set during rendering
     */
    isDefaultLayout = false

    /**
     * property editor (avoid copy & paste)
     */
    del(onChange: any, value: any, key: string) {
        value = { ...value }
        delete value[key]
        onChange(value)
    }

    /**
     * property editor (avoid copy & paste)
     */
    add(onChange: any, value: any) {
        value = { ...value }
        value[''] = ''
        onChange(value)
    }

    /**
     * property editor (avoid copy & paste)
     */
    set(onChange: any, value: any, key: string, val: string) {
        value = { ...value }
        value[key] = val
        onChange(value)
    }

    /**
     * property editor (avoid copy & paste)
     */
    setNested(onChange: any, value: any, key1: string, key2: string, val: string) {
        value = { ...value }
        if (!value[key1])
            value[key1] = {}
        value[key1][key2] = val
        onChange(value)
    }

    /**
     * property editor (avoid copy & paste)
     */
    setKey(onChange: any, value: any, key: string, keynew: string) {
        if (Number.isInteger(parseInt(keynew)) || Object.keys(value).includes(keynew))
            keynew = '_' + keynew
        const res: any = {}
        for (const [k, v] of Object.entries(value))
            if (k === key)
                res[keynew] = v
            else
                res[k] = v
        onChange(res)
    }

    /**
     * stringify to be used e.g. with useNotify() hook 
     */
    stringify(value: any): string {
        if (value === undefined)
            return 'undefined'
        if (typeof value === 'string')
            return value
        else
            return JSON.stringify(value)
    }

    /**
     * given a list of tables, return a map of table to color
     */
    color(allTables: string[]): { [key: string]: string } {
        // table colors
        const colors = [
            'lightcoral', 'lightgreen', 'lightskyblue',
            'lightgray', /*'white',*/ 'green', 'red', 'blue', 'lavender',
            'aquamarine', 'bisque', 'darkkhaki',
            'lightgoldenrodyellow'
        ]

        const tableColor: { [key: string]: string } = {}
        let colorIndex = 0

        for (const t of allTables.sort())
            tableColor[t] = colors[colorIndex++ % colors.length]

        return tableColor
    }

    /**
     * make FileReader awaitable
     */
    read = (blob: Blob, asURL: boolean) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: any) => resolve(event.target.result);
        reader.onerror = reject;
        if (asURL)
            reader.readAsDataURL(blob);
        else
            reader.readAsText(blob);
    })

    /**
     * gets the table local name
     */
    localName(s: string): string {
        if (s && typeof (s) === 'string') {
            if (s.startsWith('http://') || s.startsWith('https://')) {
                while (s.endsWith('#') || s.endsWith('/')) {
                    s = s.substring(0, s.length - 1);
                }
                if (s.indexOf('#') >= 0) return s.split('#').pop()!;
                if (s.indexOf('/') >= 0) return s.split('/').pop()!;
            }
        }
        return s;
    }

    /**
     * we changed the additionalProperties from ArrayInput to custom map edit
     * therefore, the signature of the two methods below changed
     * this method transforms to array to avoid changing this replacement code
     */
    transformQueryInfo(queryInfo: any): { query: string, arguments: { key: string, type: string, sample: string }[] } {
        return {
            query: queryInfo.query,
            arguments: queryInfo.arguments ? Object.entries(queryInfo.arguments).map(([k, v]) => {
                return {
                    key: k,
                    type: (v as any).type,
                    sample: (v as any).sample
                }
            }) : []
        }
    }

    /**
     * replaces query parameters with the samples
     */
    insertQueryParameterValues(queryInfo: { query: string, arguments: { key: string, type: string, sample: string }[] }): string {
        const quote = queryInfo.query?.toLowerCase().startsWith('select') ? "'" : '"';
        for (const { key, type, sample } of queryInfo.arguments) {
            const repl = type === 'string' || type === 'date' ? quote + sample + quote : sample;
            queryInfo.query = queryInfo.query.replace('${' + key + '}', repl);
        }
        return queryInfo.query
    }

    /**
     * transforms the query back to its original form (including ${template})
     */
    insertQueryParameterTemplates(queryInfo: { query: string, arguments: { key: string, type: string, sample: string }[] }): string {
        const quote = queryInfo.query?.toLowerCase().startsWith('select') ? "'" : '"';
        for (const { key, type, sample } of queryInfo.arguments) {
            const repl = type === 'string' || type === 'date' ? quote + sample + quote : sample;
            queryInfo.query = queryInfo.query.replace(repl, '${' + key + '}');
        }
        return queryInfo.query
    }

    /**
     * check if table is an array of objects
     */
    isTable(table: any): boolean {
        if (!Array.isArray(table))
            return false
        if (table.length === 0)
            return false
        for (const row of table)
            if (!row || typeof row !== 'object')
                return false
        return true
    }

    /**
     * extracts the text relevant to the user from a backend exception and makes sure it's not too long for display
     */
    error(error: any): string {
        const res = this.errorRaw(error)
        const limit = 400
        if (res?.length > limit)
            return res.substring(0, limit) + '...'
        return res
    }

    errorRaw(error: any): string {
        if (typeof error === 'string')
            return error
        if (error?.response?.data && (!error?.response?.data.startsWith('<!DOCTYPE html>')))
            return error.response?.data
        else if (error?.message)
            return error.message
        else
            return JSON.stringify(error)
    }

    /**
     * download an array of objects as csv
     */
    downloadCsv(data: { [key: string]: any }[]) {
        const replacer = (key: any, value: any) => value === null ? '' : value; // specify how you want to handle null values here
        const header = Object.keys(data[0]);
        const csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
        csv.unshift(header.join(','));
        const csvArray = csv.join('\r\n');

        const blob = new Blob([csvArray], { type: 'text/csv' });
        saveAs(blob, 'data.csv');
    }

    /**
     * convert css styles to mui style: font-family => fontFamily 
     */
    style(style: any): any {
        if (style) {
            const res: any = {}
            for (const [k, v] of Object.entries(style))
                if (k.indexOf('-') >= 0)
                    res[this.lowerFirstLetter(k.split('-').map(e => this.capitalizeFirstLetter(e)).join(''))] = v
                else
                    res[k] = v
            return res
        } else
            return style
    }

    capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    lowerFirstLetter(string: string): string {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    /**
     * called from edit / create in order to find out whether to show the default schema
     */
    defaultSchema(children: any, def: any): Schema | undefined {
        if (!children)
            // no children passed, we are in render mode, use default schema for the form
            return def
        if (Array.isArray(children) && children.length > 0)
            // we are in edit mode
            // [[], element] indicates that we need to use the default schema for the form
            // [el, el] indicates that the form is rendered by the first element
            return Array.isArray(children[0]) ? def : undefined
        else
            // single child indicates we are in render mode, use the child to display the form
            return undefined
    }

    getPrimaryKey(schema: Schema) {
        if (schema.properties)
            for (const p of Object.values(schema.properties))
                if (this.isValue(p.pkpos))
                    return p
    }

    /**
     * if edit related uses a schema, re-create the schema from children
     */
    schemaFromChildren(children: any, properties: { [key: string]: Schema }) {
        if (!children)
            return
        if (Array.isArray(children))
            for (const child of children)
                this.schemaFromChildren(child, properties)
        if (typeof children === 'object')
            if (children?.dataI18n?.default?.name)
                properties[children.dataI18n.default.name] = children.dataI18n.default
            else
                for (const [k, v] of Object.entries(children))
                    if (k === 'props' || k === 'cells' || k === 'children')
                        this.schemaFromChildren(v, properties)
    }

    /**
     * detect whether the layout was changed
     */
    valueChanged(old?: R[] | null, _new?: R[] | null): boolean {
        if (!old) old = []
        if (!_new) _new = []
        if (old.length !== _new.length)
            return true

        let index = 0
        for (const n of _new)
            if (this.rowChanged(old[index++], n))
                return true

        return false
    }

    /**
     * detect whether the layout was changed
     */
    rowChanged(old: R, _new: R): boolean {
        if (old.cells.length !== _new.cells.length)
            return true

        let index = 0
        for (const n of _new.cells)
            if (this.cellChanged(old.cells[index++], n))
                return true
        return false
    }

    /**
     * detect whether the layout was changed
     */
    cellChanged(old: Cell, _new: Cell): boolean {
        const _newsize = _new.size ? _new.size : 12
        const oldsize = old.size ? old.size : 12
        if (_newsize !== oldsize)
            return true
        if (JSON.stringify(_new.plugin) !== JSON.stringify(old.plugin))
            return true
        if (JSON.stringify(_new.dataI18n) !== JSON.stringify(old.dataI18n))
            return true
        if (JSON.stringify(_new.isDraftI18n) !== JSON.stringify(old.isDraftI18n))
            return true
        if (this.valueChanged(old.rows, _new.rows))
            return true
        return false
    }

    /**
     * strips /table from links to ensure compatibility with old routing scheme
     */
    href(s: string): string {
        // TODO: support legacy backend layouts
        if (typeof s === 'string') {
            if (s.startsWith('/table'))
                return s.substring('/table'.length)
            if (s.startsWith('/resource'))
                return s.substring('/resource'.length)
            if (s === '/') {
                return profile.getUISettings().homepage
            }
        } return s
    }

    /**
     * not null or undefined or NaN
     */
    isValue(x: any): boolean {
        if (x === null)
            return false
        if (x === undefined)
            return false
        if (Number.isNaN(x))
            return false
        return true
    }

    /**
     * true if x is some object {...}
     */
    isObject(x: any): boolean {
        return typeof x === 'object' &&
            !Array.isArray(x) &&
            x !== null
    }

    /**
     * compute schema from data
     */
    inferSchemaFromData(data: any[]) {
        const props: any = {};
        if (Array.isArray(data))
            for (const row of data) {
                for (const key of Object.keys(row)) {

                    // ignore RA admin id
                    if (key === 'id')
                        continue

                    const val = row[key];

                    // typeof null = object, ignore it
                    if (val === null)
                        continue

                    if (!props[key]) {
                        let type;
                        switch (typeof val) {
                            case 'string':
                                type = 'string';
                                break;
                            case 'number':
                                type = 'number';
                                break;
                            case 'boolean':
                                type = 'boolean';
                                break;
                            case 'object':
                                type = Array.isArray(val) ? 'array' : 'object';
                                break;
                        }
                        props[key] = { name: key, type: type || 'string' };
                    }
                }
            }
        const schema: Schema = { properties: props } as Schema;
        return schema;
    }

    /**
     * creates / merges the createSchema for button and variable widgets
     */
    layoutProperties2createSchema(widget: Widget): Schema | undefined {

        const createSchema = widget.createSchema
        const properties = widget.properties

        if (!createSchema && !properties)
            return undefined

        // init createSchema, syncing it with this.layout.properties
        const tmp: any = {};
        if (properties)
            for (const [k, v] of Object.entries(properties)) {
                if (v === 'date') {
                    tmp[k] = { type: 'string', widget: 'date' };
                } else if (v === 'upload') {
                    tmp[k] = { type: 'string', widget: 'upload' };
                } else {
                    tmp[k] = { type: v };
                }
            }

        if (!createSchema || !createSchema.properties) {
            // pass properties 1:1
            return { type: 'object', properties: tmp };
        } else {
            // merge
            const added = Object.keys(tmp).filter(item => !Object.keys(createSchema!.properties!).includes(item));
            const deleted = Object.keys(createSchema.properties).filter(item => !Object.keys(tmp).includes(item));
            for (const add of added) {
                createSchema.properties[add] = tmp[add];
            }
            for (const del of deleted) {
                delete createSchema.properties[del];
            }
        }

        return createSchema
    }

    /**
     * groups a table (array of rows) into a map of tables
     */
    groupBy(data: Row[], groupByCol: string): any {
        const res: any = {}
        for (const row of data) {
            const group = row[groupByCol]
            if (!res[group])
                res[group] = []
            const copy = { ...row }
            delete copy[groupByCol]
            res[group].push(copy)
        }
        return res
    }

    /**
     * gets the distinct values of a table column
     */
    distinct(data: Row[], distinctCol: string): any[] {
        const res: any[] = []
        for (const row of data) {
            const distinct = row[distinctCol]
            if (!res.includes(distinct))
                res.push(distinct)
        }
        return res
    }

    /**
     * in the config DB, table and column IDs are concatenated: dj/database/table/column. Therefore,
     * this method URLEncodes / and %
     */
    encodeTableOrColumnName(s?: string): string {
        return (s + '').replaceAll('%', '%25').replaceAll('/', '%2F');
    }

    /**
     * decode version of above
     */
    decodeTableOrColumnName(s: string): string {
        return s.replaceAll('%2F', '/').replaceAll('%25', '%');
    }

    /**
     * Column IDs in the config database look like dj/northwind/EMP/LAST_NAME
     * replaces id.split('/') since the table name might have / in it
     */
    parseColumnID(id: string): Prop {
        if (id.split('/').length === 4) {
            const res = id.split('/');
            res[2] = this.decodeTableOrColumnName(res[2]);
            res[3] = this.decodeTableOrColumnName(res[3]);
            return {
                dj: res[0],
                database: res[1],
                table: res[2],
                property: res[3],
            }
        }
        throw new Error('illegal column id: ' + id);
    }

    /**
     * Table IDs in the config database look like dj/northwind/EMP
     * replaces id.split('/') since the table name might have / in it
     */
    parseTableID(id: string): Tbl {
        if (id.split('/').length === 3) {
            const res = id.split('/');
            res[2] = this.decodeTableOrColumnName(res[2]);
            return {
                dj: res[0],
                database: res[1],
                table: res[2],
            }
        }
        throw new Error('illegal table id: ' + id);
    }

    /**
     * Database IDs in the config database look like dj/northwind
     * replaces id.split('/') since the table name might have / in it.
     * In the quey editor, the database ID might be initialized as only 'dj' which is legal
     */
    parseDatabaseID(id: string): Db {
        if (id.split('/').length === 2 || id.split('/').length === 1) {
            const res = id.split('/');
            return {
                dj: res[0],
                database: res[1]
            }
        }
        throw new Error('illegal database id: ' + id);
    }

    parseLoc(parts: string[]): Loc {
        if (parts[1] === 'page' || parts[1] === 'full')
            return {
                type: 'page',
                page: parts[2]
            }
        else if (parts[1] === 'search') {
            if (parts.length === 3)
                return {
                    type: 'search',
                    search: parts[2]
                }
            if (parts.length === 4)
                return {
                    type: 'search',
                    database: parts[2],
                    search: parts[3],
                }
            if (parts.length === 5)
                return {
                    type: 'search',
                    database: parts[2],
                    table: parts[3],
                    search: parts[4],
                }
        } else if (parts.length === 3)
            return {
                type: 'table',
                database: parts[1],
                table: parts[2]
            }
        else if (parts.length === 4)
            return {
                type: 'resource',
                database: parts[1],
                table: parts[2],
                id: parts[3]
            }
        throw new Error('Location: ' + location.pathname)
    }

    /**
     * create resource string from Tbl
     */
    toResource(tbl: Tbl | Loc | Resource): string {
        if (!tbl.table)
            throw new Error('Illegal table or location: ' + JSON.stringify(tbl))
        return tbl.database + '/' + tbl.table.replaceAll('/', '%2F')
    }

    /**
     * create [database, table] from resource
     */
    parseResource(resource: string): [string, string] {
        if (!resource)
            return [undefined as any, undefined as any]
        const parts = resource.split('/')
        if (parts.length !== 2)
            throw new Error('Illegal resource: ' + resource)
        return [parts[0], parts[1].replaceAll('%2F', '/')]
    }

    /**
     * evaluate simple templates client side
     *
     * @param expression    expression to evaluate
     * @param context       expression context
     */
    async template(expression: string, context: any) {
        if (!expression) {
            return '';
        } else if (expression.includes('<%') && expression.includes('%>')) {
            /*
            try {
                // Compile the Embedded JavaScript (EJS) template
                const template = ejs.compile(expression);
                // Evaluate the template with our context
                const html = template(context);
                return html;
            }
            catch (evalError) {
                return expression;
            }
            */
            return expression;
            // throw new Error('EJS is no longer supported')
        } else if (expression.includes('${')) {
            // string replace ${jsonata path} with context values

            // gather the list of variables used
            const ea: string[] = []
            expression.replace(/\${(.*?)}/g, (g) => {
                ea.push(g)
                return ''
            });

            // evaluate the expressions and await the result
            const em: any = {}
            for (const e of ea) {
                em[e] = await jsonata(e.substring(2, e.length - 1)).evaluate(context)
            }

            // using the result map, do the final replace
            return expression.replace(/\${(.*?)}/g, (e) => {
                return this.isValue(em[e]) ? em[e] : ''
            });
        } else {
            return expression;
        }
    }

    /**
     * evaluate simple templates client side
     * expressions cannot be full jsonata but rather simple 
     * record lookups
     *
     * @param expression    expression to evaluate
     * @param context       expression context
     */
    label(expression: string, context: any) {
        return expression.replace(/\${(.*?)}/g, (g) => {
            g = g.substring('${'.length, g.length - '}'.length)
            if (typeof context === 'object' && this.isValue(context[g]))
                return context[g]
            else
                return ''
        })
    }

    /**
     * converts a map to an array by including the map key into the array
     */
    map2array(data: { [key: string]: any }): any[] {
        const res = []
        for (const [key, value] of Object.entries(data))
            if (typeof value === 'object')
                res.push({ key, ...value })
            else
                res.push({ key, value })
        return res
    }

    /**
     * inverse of map2array
     */
    array2map(data: any[]): { [key: string]: any } {
        const res: { [key: string]: any } = {}
        for (const value of data) {
            const key = value.key
            delete value.key
            if (Object.values(value).length === 1)
                res[key] = Object.values(value)[0]
            else
                res[key] = value
        }
        return res
    }

    /**
     * helper for the page editor
     * converts react page <=> DJ widget
     */
    widget2value(widget: Widget): Value {
        const counter = { i: 0 }
        return {
            id: 'id' + counter.i++,
            rows: this.children2rows(widget.children!, counter),
            version: 1
        }
    }

    /**
     * handle child layout
     */
    children2rows(children: Widget[] | Schema[], counter: { i: number }): R[] {
        const rows: R[] = []
        let cells: any[] = []
        for (const child of children ? children : [])
            if (child.size) {

                // is the current row full?
                if (cells.reduce((p, c) => p + c.size, 0) === 12) {
                    rows.push({
                        id: 'id' + counter.i++,
                        cells
                    })
                    cells = []
                }

                // cell in row with other cells
                // we can treat a form schema like a widget here 
                cells.push(this.widget2cell(child as any, counter))
            }
            else {
                // widget takes up the entire row
                if (cells.length > 0) {
                    rows.push({
                        id: 'id' + counter.i++,
                        cells
                    })
                    cells = []
                }

                rows.push({
                    id: 'id' + counter.i++,
                    // we can treat a form schema like a widget here 
                    cells: [this.widget2cell(child as any, counter)]
                })
            }

        if (cells.length > 0) {
            rows.push({
                id: 'id' + counter.i++,
                cells
            })
            cells = []
        }

        return rows
    }

    /**
     * create a cell from widget
     */
    widget2cell(child: Widget, counter: { i: number }): Cell {
        child = { ...child }

        // widget.properties is deprecated
        if (child.widget === 'button' || child.widget === 'variable')
            if (child.properties && Object.keys(child.properties).length > 0) {
                child.createSchema = this.layoutProperties2createSchema(child)
                delete child.properties
            }

        // widget.createSchema is deprecated
        if (child.createSchema) {
            child.schema = child.createSchema
            delete child.createSchema
        }

        const children = child.children
        const schema = child.schema
        const widget = child.widget && (!(w.enum.includes(child.widget))) ? child.widget : 'input'
        const isDraft = child.isDraft
        const size = child.size

        // remove children (they are added in rows below)
        delete child.children
        if (widget !== 'input')
            delete child.widget
        delete child.isDraft
        delete child.size
        delete child.schema

        const cell: Cell = {
            id: 'id' + counter.i++,
            plugin: {
                // widget.widget is plugin id
                id: widget,
                version: 1
            },
            dataI18n: {
                // insert the widget here
                default: child as any
            }
        }

        if (size)
            cell.size = size

        if (isDraft)
            cell.isDraftI18n = { default: true }

        if (children)
            cell.rows = this.children2rows(children, counter)

        if (schema && schema.properties) {
            const schemas: Schema[] = []
            for (const [k, v] of Object.entries(schema.properties)) {
                const copy = { ...v }
                copy.name = k
                schemas.push(copy)
            }
            cell.rows = this.children2rows(schemas, counter)
        }

        return cell
    }

    /**
     * helper for the page editor
     * converts react page <=> DJ widget
     */
    value2widget(value: Value): Widget {
        return {
            widget: 'page',
            children: this.rows2children(value.rows)
        }
    }

    /**
     * create widgets from cells
     */
    rows2children(rows: R[]): Widget[] {
        const children: Widget[] = []
        for (const r of rows)
            for (const c of r.cells)
                if (c.dataI18n) {
                    const child: Widget = {
                        ...c.dataI18n.default
                    }
                    if (c.plugin?.id !== 'input')
                        // if we use "duplicate widget" we can have a nested structure without plugin.id
                        child.widget = c.plugin?.id ? c.plugin?.id : 'container'
                    if (c.size && c.size !== 12)
                        child.size = c.size
                    if (c.isDraftI18n?.default === true)
                        child.isDraft = true
                    if (c.rows && c.rows.length > 0)
                        if (c.plugin?.id === 'button' || c.plugin?.id === 'variable' || c.plugin?.id === 'create' || c.plugin?.id === 'edit' || c.plugin?.id === 'editRelated!') {
                            child.schema = {
                                type: 'object',
                                properties: {}
                            }
                            // cast from Widget[] to Schema[]
                            for (const s of this.rows2children(c.rows) as Schema[]) {
                                if (Array.isArray((s as any).children) && s.widget === 'container') {
                                    // in forms there is no concept of "container"
                                    // if the layout editor yields such a nested structure, we need to flatten it here
                                    // the first element retains the size, the others are simply added in rows below
                                    let size = s.size
                                    for (const c of (s as any).children) {
                                        child.schema.properties![c.name!] = c
                                        delete c.name
                                        if (size) {
                                            c.size = size
                                            size = undefined
                                        }
                                    }
                                } else {
                                    child.schema.properties![s.name!] = s
                                    delete s.name
                                }
                            }
                        } else
                            child.children = this.rows2children(c.rows)
                    children.push(child)
                }
        return children
    }

    /**
     * true is two schemas are the same
     */
    schemaEquals(a: Schema, b: Schema): boolean {

        if (!a.properties)
            return !b.properties || Object.keys(b.properties).length === 0
        if (!b.properties)
            return !a.properties || Object.keys(a.properties).length === 0

        // the order of the props is important for rendering
        if (JSON.stringify(Object.keys(a.properties)) !== JSON.stringify(Object.keys(b.properties)))
            return false

        for (const [name, prop] of Object.entries(a.properties))
            if (!this.propEquals(prop, b.properties[name]))
                return false
        for (const [name, prop] of Object.entries(b.properties))
            if (!this.propEquals(prop, a.properties[name]))
                return false

        return true
    }

    /**
     * helper for schemaEquals
     */
    propEquals(a: Schema, b: Schema): boolean {
        for (const [k, v] of Object.entries(a))
            if (k !== 'name')
                if (v !== (b as any)[k])
                    if (!((v === undefined && (b as any)[k] === false) || (v === false && (b as any)[k] === undefined)))
                        if (!((v === undefined && (b as any)[k] === '') || (v === '' && (b as any)[k] === undefined)))
                            return false
        for (const [k, v] of Object.entries(b))
            if (k !== 'name')
                if (v !== (a as any)[k])
                    if (!((v === undefined && (a as any)[k] === false) || (v === false && (a as any)[k] === undefined)))
                        if (!((v === undefined && (a as any)[k] === '') || (v === '' && (a as any)[k] === undefined)))
                            return false
        return true
    }

    /**
     * in the form, field names that contain "." are 
     */
    handleDots(value: any) {
        if (value) {
            for (const key of Object.keys(value)) {
                if (this.isObject(value[key]))
                    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('urn:') || key.startsWith('mailto:') || key.startsWith('ldap:')) {
                        const flat = {}
                        this.flatten(key, value[key], flat)
                        delete value[key]
                        value = { ...value, ...flat }
                    }
            }
        }
        return value
    }

    /**
     * in the form, {x:1} becomes [{key:x, value:1}]
     */
    handleKeyValue(value: any) {
        if (value)
            for (const key of Object.keys(value))
                if (Array.isArray(value[key])) {
                    const arr = value[key]
                    if (arr.length > 0) {
                        const first = arr[0]
                        if (this.isObject(first)) {
                            if (Object.keys(first).length === 2)
                                if (Object.keys(first).includes('key') && Object.keys(first).includes('value'))
                                    value[key] = this.array2map(value[key])
                            if (Object.keys(first).length === 3)
                                if (Object.keys(first).includes('key') && Object.keys(first).includes('sample') && Object.keys(first).includes('type'))
                                    value[key] = this.array2map(value[key])
                        }
                    }
                }
        return value
    }

    /**
     * recursive helper for handleDots
     */
    flatten(prefix: string, value: any, res: any): void {
        if (this.isObject(value)) {
            for (const [k, v] of Object.entries(value))
                this.flatten(prefix + '.' + k, v, res)
        }
        else
            res[prefix] = value
    }

    /**
     * Publish (optional data) to the given topic
     */
    publish<T>(topic: string, data?: T) {
        PubSub.publish(topic, data);
    }

    /**
     * Subscribe to the given topic
     * 
     * @param topic 
     * @param callback 
     */
    subscribe<T>(topic: string, callback: (topic: string, data: T) => (void)) {
        PubSub.subscribe(topic, callback);
    }

    /**
     * Unsubscribe from the given topic
     * 
     * @param topic 
     */
    unsubscribe(topic: string) {
        PubSub.unsubscribe(topic);
    }

    normalizeValue(data: any) {

        if (!data)
            return data

        // {href, label?}
        if (Object.keys(data).length === 1 && data.href)
            return data.href
        if (Object.keys(data).length === 2 && data.href && data.label && (typeof data.label === 'string' || typeof data.label === 'number'))
            return data.label

        // {date}
        if (data.date)
            if (Object.keys(data).length === 1)
                return data.date

        // {datetime}
        if (data.datetime)
            if (Object.keys(data).length === 1)
                return data.datetime

        // {img, width?, height?}
        if (data.img) {
            if (Object.keys(data).length === 1)
                return data.img
            if (Object.keys(data).length === 2 && data.width)
                return data.img
            if (Object.keys(data).length === 2 && data.height)
                return data.img
            if (Object.keys(data).length === 3 && data.width && data.height)
                return data.img
        }

        // {database, table, pk1, page?}
        if (Object.keys(data).length === 4)
            if (data.database && data.table && util.isValue(data.pk1) && data.page)
                return data.pk1

        if (Object.keys(data).length === 3)
            if (data.database && data.table && util.isValue(data.pk1))
                return data.pk1

        return data
    }

    /**
     * convert widget.editRedirect to redirect attribute
     * see https://marmelab.com/react-admin/Edit.html#redirect
     */
    getRedirect(s?: string): any {
        if (!s)
            return undefined
        if (s === 'table')
            return undefined
        if (s === 'record')
            return false
        return () => s
    }
}

export const util = new Util()

/**
 * useSubscribe React hook for use in functional components
 * 
 * @param topic 
 * @param callback 
 * @param deps 
 */
export const useSubscribe = <T>(topic: string, callback: (topic: string, data: T) => (void), deps = []) => {
    React.useEffect(() => {
        //console.log('sub', topic)
        PubSub.subscribe(topic, callback);
        return () => { PubSub.unsubscribe(topic) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
