/**
 * @jest-environment jsdom
 */
import axios from "axios";
import { expect, test } from '@jest/globals';
import { dataProvider } from "./DjDataProvider";
import { localStorageMock } from "./Util.test";

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// make sure axios uses port 8080
axios.defaults.baseURL = 'http://localhost:8080/'

test('expression', async () => {
    expect(await dataProvider.expression('1+2', {})).toBe(3)
    expect(await dataProvider.expression('x', { x: 1 })).toBe(1)
})

test('expression-preview', async () => {
    expect(await dataProvider.expressionPreview('1+2', {})).toBe(3)
    // delete is not run in preview mode
    expect(await dataProvider.expressionPreview('$delete("db", "table", "pk1")', {})).toBeNull()
    expect(await dataProvider.expressionPreview('$streamJson("file:upload/test.json")', {}, true)).toEqual([3.1415])
})

test('getManyReference', async () => {
    const res = await dataProvider.getManyReference('northwind/EMPLOYEES', {
        target: 'REPORTS_TO',
        id: 2,
        pagination: { page: 2, perPage: 2 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })
    expect(res.data[0].LAST_NAME).toBe('Davolio')
    expect(res.pageInfo?.hasPreviousPage).toBeTruthy()
    expect(res.pageInfo?.hasNextPage).toBeTruthy()
})

test('getManyReference2', async () => {
    const res = await dataProvider.getManyReference('northwind/EMPLOYEES', {
        target: 'REPORTS_TO',
        id: 2,
        pagination: { page: 3, perPage: 2 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })
    expect(res.data[0].LAST_NAME).toBe('Peacock')
    expect(res.total).toBe(5)
    expect(res.data.length).toBe(1)
})

test('getList', async () => {
    expect((await dataProvider.getList('northwind/EMPLOYEES', {
        pagination: { page: 1, perPage: 5 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })).data[0].LAST_NAME).toBe('Buchanan')
})

test('getList page 2', async () => {
    expect((await dataProvider.getList('northwind/EMPLOYEES', {
        pagination: { page: 2, perPage: 5 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })).data[0].LAST_NAME).toBe('King')
})

test('getList filter', async () => {
    const res = await dataProvider.getList('northwind/EMPLOYEES', {
        pagination: { page: 1, perPage: 5 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: { LAST_NAME: 'Fuller' }
    })
    expect(res.data[0].LAST_NAME).toBe('Fuller')
    expect(res.data.length).toBe(1)
})

test('getList sort by id yields natural order', async () => {
    expect((await dataProvider.getList('northwind/EMPLOYEES', {
        pagination: { page: 1, perPage: 5 },
        sort: { field: 'id', order: 'ASC' },
        filter: undefined
    })).data[0].LAST_NAME).toBe('Davolio')
})

test('getList 2', async () => {
    expect((await dataProvider.getList('northwind/EMPLOYEES', {
        pagination: { page: 2, perPage: 5 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })).data[0].LAST_NAME).toBe('King')
})

test('getOne', async () => {
    expect((await dataProvider.getOne('northwind/EMPLOYEES', { id: 2 })).data.LAST_NAME).toBe('Fuller')
})
