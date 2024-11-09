/**
 * @jest-environment jsdom
 */
import { api } from "./Api"
import { expect, test } from '@jest/globals';
import { localStorageMock } from "./Util.test";

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

test('crud', async () => {
    const n = await api.create('northwind', 'CITY', {})
    api.clearCache()
    const id = n.split('/')[3]
    await api.update('northwind', 'CITY', id, { NAME: 'CRUD' })
    api.clearCache()
    expect((await api.read('northwind', 'CITY', id)).NAME).toBe('CRUD')
    await api.delete('northwind', 'CITY', id);
    api.clearCache()
    await expect(api.read('northwind', 'CITY', id)).rejects.toThrow()
})

test('crudComp', async () => {
    await api.create('northwind', 'ORDER_DETAILS', { ORDER_ID: 10248, PRODUCT_ID: 1, UNIT_PRICE: 11, QUANTITY: 11, DISCOUNT: 11 })
    api.clearCache()
    await api.updateComp('northwind', 'ORDER_DETAILS', [10248, 1], { DISCOUNT: 123 })
    api.clearCache()
    expect((await api.readComp('northwind', 'ORDER_DETAILS', [10248, 1])).DISCOUNT).toBe(123)
    await api.deleteComp('northwind', 'ORDER_DETAILS', [10248, 1]);
    api.clearCache()
    await expect(api.readComp('northwind', 'ORDER_DETAILS', [10248, 1])).rejects.toThrow()
})

test('all', async () => {
    let n = await api.all('northwind', 'EMPLOYEES', {})
    expect(n.length).toBe(9)
    n = await api.all('northwind', 'EMPLOYEES', { sort: { field: 'FIRST_NAME', order: 'asc' } })
    expect(n[0].FIRST_NAME).toBe('Andrew')
    n = await api.all('northwind', 'EMPLOYEES', { pageSize: 1, cursor: 1 })
    expect(n[0].LAST_NAME).toBe('Fuller')
    expect(n.length).toBe(1)
})

test('search', async () => {
    let n = await api.search('Fuller')
    expect(n.length).toBe(2)
    expect(n[0].match).toBe('Fuller')
})

test('searchDb', async () => {
    let n = await api.search('Fuller', 'northwind')
    expect(n.length).toBe(1)
    expect(n[0].match).toBe('Fuller')
})

test('searchTable', async () => {
    let n = await api.search('Fuller', 'northwind', 'CITY')
    expect(n.length).toBe(0)
})

test('query', async () => {
    let n = await api.query('northwind', 'orgchart', { node: 2 })
    expect(n.length).toBe(5)
    const schema = await api.queryMeta('northwind', 'orgchart', { node: 2 })
    expect(schema.properties!['EMPLOYEES.EMPLOYEE_ID'].ID).toBe('dj/northwind/EMPLOYEES/EMPLOYEE_ID')
})

test('expression', async () => {
    let n = await api.expression('1+2', {})
    expect(n).toBe(3)
})

test('schema', async () => {
    let n = await api.schema('northwind', 'CITY')
    expect(n.properties?.['ID'].name).toBe('ID')
})

test('tables', async () => {
    let n = await api.tables()
    expect(n.includes('dj/northwind/EMPLOYEES')).toBeTruthy()
})

