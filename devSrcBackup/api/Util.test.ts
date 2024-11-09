/**
 * @jest-environment jsdom
 */

import { expect, test } from '@jest/globals';
import { Value } from '@react-page/editor';
import { Widget } from '../model/widget';
import { util } from "./Util";

test('href', () => {
    expect(util.href('http://example.org')).toBe('http://example.org')
    expect(util.href('/table/a/b')).toBe('/a/b')
})

test('isTable', () => {
    expect(util.isTable(1)).toBeFalsy()
    expect(util.isTable(null)).toBeFalsy()
    expect(util.isTable([])).toBeFalsy()
    expect(util.isTable([1])).toBeFalsy()
    expect(util.isTable([{ x: 1 }])).toBeTruthy()
})

test('isValue', () => {
    expect(util.isValue(1)).toBeTruthy()
    expect(util.isValue(0)).toBeTruthy()
    expect(util.isValue(true)).toBeTruthy()
    expect(util.isValue(false)).toBeTruthy()
    expect(util.isValue('')).toBeTruthy()
    expect(util.isValue('x')).toBeTruthy()
    expect(util.isValue([])).toBeTruthy()
    expect(util.isValue({})).toBeTruthy()
    expect(util.isValue(0.0)).toBeTruthy()

    expect(util.isValue(null)).toBeFalsy()
    expect(util.isValue(NaN)).toBeFalsy()
    expect(util.isValue(undefined)).toBeFalsy()
})

test('isObject', () => {
    expect(util.isObject(null)).toBeFalsy()
    expect(util.isObject(undefined)).toBeFalsy()
    expect(util.isObject('')).toBeFalsy()
    expect(util.isObject([1, 2, 3])).toBeFalsy()
    expect(util.isObject({})).toBeTruthy()
    expect(util.isObject({ x: 1 })).toBeTruthy()
})

test('inferSchemaFromData', () => {
    const schema = util.inferSchemaFromData([{ zero: 0, x: 1 }, { y: 'str', x: 'fe' }, {}, { z: true, obj: {}, arr: [] }])
    expect(Object.keys(schema.properties!).length).toBe(6)
    expect(schema.properties!.zero.type).toBe('number')
    expect(schema.properties!.x.type).toBe('number')
    expect(schema.properties!.y.type).toBe('string')
    expect(schema.properties!.z.type).toBe('boolean')
    expect(schema.properties!.obj.type).toBe('object')
    expect(schema.properties!.arr.type).toBe('array')
})

test('inferSchemaFromData2', () => {
    expect(util.inferSchemaFromData(undefined as any)).toEqual({ properties: {} })
    expect(util.inferSchemaFromData(123 as any)).toEqual({ properties: {} })
    expect(util.inferSchemaFromData([1, 2, 3])).toEqual({ properties: {} })
})

test('layoutProperties2createSchema', () => {
    // props only
    let schema = util.layoutProperties2createSchema({ properties: { s: 'string' } })
    expect(schema).toEqual({ type: 'object', properties: { s: { type: 'string' } } })

    // createSchema merge
    schema = util.layoutProperties2createSchema({
        createSchema: {
            properties: {
                s: { layout: 'vertical' }, // specified in props, use this version
                d: { layout: 'vertical' }, // deleted
            }
        } as any,
        properties: {
            s: 'string',
            p: 'string',
        }
    })
    expect(schema).toEqual({ properties: { s: { layout: 'vertical' }, p: { type: 'string' } } })
})

test('groupBy', () => {
    const table = util.groupBy([
        { x: 'a', y: 1 },
        { x: 'a', y: 2 },
        { x: 'b', y: 3 },
    ], 'x')
    expect(table).toEqual({
        a: [{ y: 1 }, { y: 2 }],
        b: [{ y: 3 }]
    })
})

test('groupByMissing', () => {
    const table = util.groupBy([
        { x: 'a', y: 1 },
        { y: 2 },
        { x: 'b' },
    ], 'x')
    expect(table).toEqual({
        a: [{ y: 1 }],
        // undefiined key get's "toStringed"
        'undefined': [{ y: 2 }],
        b: [{}]
    })

    // group by key is an object
    expect(util.groupBy([{ x: {} }], 'x')).toEqual({ '[object Object]': [{}] })

    // group by key is an array
    expect(util.groupBy([{ x: [] }], 'x')).toEqual({ '': [{}] })
})

test('distinct', () => {
    const distinct = util.distinct([
        { x: 'a', y: 1 },
        { y: 2 },
        { x: 'b' },
    ], 'x')
    expect(distinct).toEqual(['a', undefined, 'b'])
})

test('encodeTableOrColumnName', () => {
    let res = util.encodeTableOrColumnName('http://example.com/prop')
    expect(res).toBe('http:%2F%2Fexample.com%2Fprop')

    res = util.encodeTableOrColumnName('prop')
    expect(res).toBe('prop')
})

test('decodeTableOrColumnName', () => {
    let res = util.decodeTableOrColumnName('a%2Fb')
    expect(res).toBe('a/b')

    res = util.decodeTableOrColumnName('prop')
    expect(res).toBe('prop')
})

test('parseColumnID', () => {
    let res = util.parseColumnID('dj/db/table/pr%2Fop')
    expect(res).toEqual({ dj: 'dj', database: 'db', table: 'table', property: 'pr/op' })

    expect(() => util.parseDatabaseID('dj/db/table/pr%2Fop')).toThrow()
})

test('template', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(await util.template('-${a.b}-', { a: { b: 123 } })).toBe('-123-')
    // eslint-disable-next-line no-template-curly-in-string
    expect(await util.template('-${a.b}-', { a: { b: 0 } })).toBe('-0-')
    // eslint-disable-next-line no-template-curly-in-string
    expect(await util.template('-${a.b}-', undefined)).toBe('--')
    // eslint-disable-next-line no-template-curly-in-string
    expect(await util.template('-$ {a.b}-', { a: { b: 123 } })).toBe('-$ {a.b}-')
})

test('label', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(util.label('-${b}-', { b: 123 })).toBe('-123-')
    // eslint-disable-next-line no-template-curly-in-string
    expect(util.label('-${b}-', { b: 0 })).toBe('-0-')
    // eslint-disable-next-line no-template-curly-in-string
    expect(util.label('-${b}-', undefined)).toBe('--')
    // eslint-disable-next-line no-template-curly-in-string
    expect(util.label('-${b}-', {})).toBe('--')
    // eslint-disable-next-line no-template-curly-in-string
    expect(util.label('-$ {b}-', { b: 123 })).toBe('-$ {b}-')
})

test('map2array', () => {
    expect(util.map2array({ url: 'test' })).toEqual([{ key: 'url', value: 'test' }])
    expect(util.map2array({ limit: { type: 'string', sample: '1' }, offset: { type: 'string', sample: '2' } })).toEqual([{ key: 'limit', type: 'string', sample: '1' }, { key: 'offset', type: 'string', sample: '2' }])
})

test('array2map', () => {
    expect(util.array2map([{ key: 'url', value: 'test' }])).toEqual({ url: 'test' })
    expect(util.array2map([{ key: 'limit', type: 'string', sample: '1' }, { key: 'offset', type: 'string', sample: '2' }])).toEqual({ limit: { type: 'string', sample: '1' }, offset: { type: 'string', sample: '2' } })
})

test('widget2value', () => {
    const widget = {
        widget: 'page', children: [
            {
                widget: 'markdown',
                markdown: 'test'
            }
        ]
    }
    const value = util.widget2value(widget)

    expect(value.rows[0].cells[0].plugin?.id).toBe('markdown')
    expect(value.rows[0].cells[0].dataI18n?.default.markdown).toBe('test')
    expect(util.value2widget(value)).toEqual(widget)
})

test('widget2value nested', () => {
    const widget = {
        widget: 'page', children: [
            {
                widget: 'group',
                children: [
                    {
                        widget: 'markdown',
                        markdown: 'test'
                    }
                ]
            }
        ]
    }
    const value = util.widget2value(widget)

    expect(value.rows[0].cells[0].plugin?.id).toBe('group')
    expect(value.rows[0].cells[0].dataI18n?.default.children).toBeUndefined()
    expect((value.rows[0].cells[0] as any).rows[0].cells[0].dataI18n?.default.markdown).toBe('test')
    expect((value.rows[0].cells[0] as any).rows[0].id).toBe('id3')
    expect((value.rows[0].cells[0] as any).rows[0].cells[0].id).toBe('id4')

    expect(util.value2widget(value)).toEqual(widget)
})

test('widget2value resize', () => {
    const widget = {
        widget: 'page', children: [
            {
                widget: 'markdown',
                markdown: 'm1',
                size: 4
            },
            {
                widget: 'markdown',
                markdown: 'm2',
                size: 8
            },
        ]
    }
    const value = util.widget2value(widget)
    value.rows[0].cells[0].size = 2
    value.rows[0].cells[1].size = 10

    expect(util.value2widget(value).children![0].size).toBe(2)
})

test('widget2value row', () => {
    const widget = {
        widget: 'page', children: [
            {
                widget: 'markdown',
                markdown: 'm1',
                size: 4
            },
            {
                widget: 'markdown',
                markdown: 'm2',
                size: 8
            },
        ]
    }
    const value = util.widget2value(widget)

    expect(value.rows[0].cells[0].plugin?.id).toBe('markdown')
    expect(value.rows[0].cells[0].size).toBe(4)
    expect(value.rows[0].cells[0].dataI18n?.default.markdown).toBe('m1')

    expect(value.rows[0].cells[1].plugin?.id).toBe('markdown')
    expect(value.rows[0].cells[1].size).toBe(8)
    expect(value.rows[0].cells[1].dataI18n?.default.markdown).toBe('m2')

    expect(util.value2widget(value)).toEqual(widget)
})

test('widget2value square', () => {
    const widget = {
        widget: 'page', children: [
            {
                widget: 'markdown',
                markdown: 'm1',
                size: 4
            },
            {
                widget: 'markdown',
                markdown: 'm2',
                size: 8
            },
            {
                widget: 'markdown',
                markdown: 'm3',
                size: 3
            },
            {
                widget: 'markdown',
                markdown: 'm4',
                size: 9
            },
        ]
    }
    const value = util.widget2value(widget)

    expect(value.rows[0].cells[0].dataI18n?.default.markdown).toBe('m1')
    expect(value.rows[0].cells[1].dataI18n?.default.markdown).toBe('m2')
    expect(value.rows[1].cells[0].dataI18n?.default.markdown).toBe('m3')
    expect(value.rows[1].cells[1].dataI18n?.default.markdown).toBe('m4')

    expect(util.value2widget(value)).toEqual(widget)
})

test('widget2value draft', () => {
    const widget: Widget = {
        widget: 'page',
        children: [{
            widget: 'text',
            isDraft: true
        }]
    }
    const value = util.widget2value(widget)
    expect(value.rows[0].cells[0].isDraftI18n?.default).toBe(true)
    expect(util.value2widget(value)).toEqual(widget)
})

test('value2widget', () => {
    const value: Value = {
        id: 'id0',
        rows: [{
            id: 'id2',
            cells: [{
                id: 'id1',
                plugin: {
                    id: 'text',
                    version: 1
                },
                dataI18n: {
                    default: {
                        text: 'hi'
                    }
                },
                size: 11,
                isDraftI18n: { default: true }
            }]
        }],
        version: 1
    }

    const widget = util.value2widget(value)

    expect(util.widget2value(widget)).toEqual(value)
})

test('schema2value basic', () => {
    const value = util.widget2value({
        widget: 'page',
        children: [{
            widget: 'button',
            // gets removed - schema created instead
            properties: {
                age: 'number'
            }
        }]
    })
    expect(value.rows[0].cells[0].rows?.[0].cells[0].plugin?.id).toBe('input')
})

test('schema2value basic 2', () => {
    const value = util.widget2value({
        widget: 'page',
        children: [{
            widget: 'button',
            // gets removed - schema created instead
            createSchema: {
                type: 'object',
                properties: {
                    age: { type: 'number', widget: 'textarea' }
                }
            }
        }]
    })

    expect(value.rows[0].cells[0].rows?.[0].cells[0].plugin?.id).toBe('input')
    expect(value.rows[0].cells[0].rows?.[0].cells[0].dataI18n?.default.widget).toBe('textarea')

    expect(util.value2widget(value).children?.[0].schema?.properties?.age.type).toBe('number')
})

test('schema2value', () => {
    const widget: Widget = {
        widget: 'page',
        children: [
            {
                widget: 'button',
                size: 8,
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        age: { type: 'number' }
                    }
                }
            }
        ]
    }

    const value = util.widget2value(widget)
    expect(value.rows[0].cells[0].plugin?.id).toBe('button')
    expect(value.rows[0].cells[0].rows?.[0].cells[0].dataI18n?.default.name).toBe('name')
    expect(value.rows[0].cells[0].rows?.[1].cells[0].dataI18n?.default.name).toBe('age')

    expect(util.value2widget(value)).toEqual(widget)
})

// for resources, we also need to encode # and other chars, since resource appears on the URL 1:1
test('toResource', () => {
    expect(util.toResource({ dj: 'dj', database: 'db', table: 'a/b' })).toBe('db/a%2Fb')
    expect(util.toResource({ dj: 'dj', database: 'db', table: 'a%b' })).toBe('db/a%b')
    expect(util.toResource({ dj: 'dj', database: 'db', table: 'a#b' })).toBe('db/a#b')

    expect(util.parseResource('db/a%2Fb')).toEqual(['db', 'a/b'])
    expect(util.parseResource('db/a%b')).toEqual(['db', 'a%b'])
    expect(util.parseResource('db/a#b')).toEqual(['db', 'a#b'])
})

test('queryParameterInsert', () => {
    const qi = {
        // eslint-disable-next-line no-template-curly-in-string
        query: 'select * from emp where id = ${x}',
        arguments: [{
            key: 'x',
            type: 'integer',
            sample: '1'
        }]
    }
    expect(util.insertQueryParameterValues(qi)).toBe('select * from emp where id = 1')
    // eslint-disable-next-line no-template-curly-in-string
    expect(util.insertQueryParameterTemplates({ arguments: qi.arguments, query: util.insertQueryParameterValues(qi) })).toBe('select * from emp where id = ${x}')
})

test('stringify', () => {
    expect(util.stringify(undefined)).toBe('undefined')
    expect(util.stringify(null)).toBe('null')
    expect(util.stringify(123)).toBe('123')
    expect(util.stringify('hi')).toBe('hi')
    expect(util.stringify([1, 2, 3])).toBe('[1,2,3]')
    expect(util.stringify({})).toBe('{}')
})

test('schemaEqualsTrue', () => {
    expect(util.schemaEquals(
        { type: 'object' },
        { type: 'object' }
    )).toBeTruthy()
    expect(util.schemaEquals(
        { type: 'object' },
        { type: 'object', properties: {} }
    )).toBeTruthy()
    expect(util.schemaEquals(
        { type: 'object', properties: { 'x': { 'type': 'string' } } },
        { type: 'object', properties: { 'x': { 'type': 'string' } } }
    )).toBeTruthy()
    expect(util.schemaEquals(
        { type: 'object', properties: { 'x': { 'type': 'string', name: 'x' } } },
        { type: 'object', properties: { 'x': { 'type': 'string' } } }
    )).toBeTruthy()
    expect(util.schemaEquals(
        { type: 'object', properties: { 'x': { 'type': 'string', readOnly: false } } },
        { type: 'object', properties: { 'x': { 'type': 'string' } } }
    )).toBeTruthy()
    expect(util.schemaEquals(
        { type: 'object', properties: { 'x': { 'type': 'string', title: '' } } },
        { type: 'object', properties: { 'x': { 'type': 'string' } } }
    )).toBeTruthy()
})

test('schemaEqualsFalse', () => {
    expect(util.schemaEquals(
        { type: 'object' },
        { type: 'object', properties: { 'x': { 'type': 'string' } } },
    )).toBeFalsy()
    expect(util.schemaEquals(
        { type: 'object', properties: { y: { 'type': 'string' }, x: { 'type': 'string' } } },
        { type: 'object', properties: { x: { 'type': 'string' }, y: { 'type': 'string' } } },
    )).toBeFalsy()
    expect(util.schemaEquals(
        { type: 'object', properties: { y: { 'type': 'string' }, x: { 'type': 'string' } } },
        { type: 'object', properties: { a: { 'type': 'string' }, b: { 'type': 'string' } } },
    )).toBeFalsy()
    expect(util.schemaEquals(
        { type: 'object', properties: { 'x': { 'type': 'string', readOnly: true } } },
        { type: 'object', properties: { 'x': { 'type': 'string' } } }
    )).toBeFalsy()
})

export const localStorageMock = (() => {
    return {
        getItem(key: string) {
            if (key === 'variable') return JSON.stringify({ homepage: '/page/Home' })
            return null;
        },
    };
})();

Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
});

test('href', () => {
    expect(util.href('/')).toBe('/page/Home')
    expect(util.href(1 as any)).toBe(1)
})

test('handleDots', () => {
    expect(util.handleDots({ ID: 1, 'http://example': { org: 2 } })).toEqual({ ID: 1, 'http://example.org': 2 })
    expect(util.handleDots({ ID: 1, 'http://example': { org: 'two' } })).toEqual({ ID: 1, 'http://example.org': 'two' })
    expect(util.handleDots({ ID: 1, example: { org: 2 } })).toEqual({ ID: 1, example: { org: 2 } })
    expect(util.handleDots({ ID: 1, 'http://www': { example: { org: 2 } } })).toEqual({ ID: 1, 'http://www.example.org': 2 })
})

test('handleKeyValue', () => {
    // do not touch these
    let same: any = { p: {} }
    expect(util.handleKeyValue(same)).toEqual(same)
    same = { p: { key: 'x', value: 1 } }
    expect(util.handleKeyValue(same)).toEqual(same)
    same = { p: [{ key: 'x', __: 1 }] }
    expect(util.handleKeyValue(same)).toEqual(same)
    same = { p: [{ key: 'x', value: 1, other: 1 }] }
    expect(util.handleKeyValue(same)).toEqual(same)

    // key value array
    expect(util.handleKeyValue({ p: [{ key: 'x', value: 1 }] })).toEqual({ p: { x: 1 } })
    expect(util.handleKeyValue({ p: [{ key: 'x', value: 1 }, { key: 'y', value: 2 }] })).toEqual({ p: { x: 1, y: 2 } })
    // key value array including null
    expect(util.handleKeyValue({ p: [{ key: 'x', value: null }] })).toEqual({ p: { x: null } })
    // key value array of query editor args
    expect(util.handleKeyValue({ p: [{ key: 'x', sample: null, type: 'string' }] })).toEqual({ p: { x: { sample: null, type: 'string' } } })
})

test('colors', () => {
    expect(util.color(['b', 'a'])).toEqual({ a: 'lightcoral', b: 'lightgreen' })
})