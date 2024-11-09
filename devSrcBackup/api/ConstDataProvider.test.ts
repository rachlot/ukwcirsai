/**
 * @jest-environment jsdom
 */
import axios from "axios";
import { expect, test } from '@jest/globals';
import { constDataProvider } from "./ConstDataProvider";
import { dataProvider } from "./DjDataProvider";
import { localStorageMock } from "./Util.test";

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// make sure axios uses port 8080
axios.defaults.baseURL = 'http://localhost:8080/'

const provider = async () => {
    const tmp = await dataProvider.getList('northwind/EMPLOYEES', {
        sort: { field: 'EMPLOYEE_ID', order: 'ASC' },
        pagination: { page: 1, perPage: 10 },
        filter: undefined
    })
    return constDataProvider.create(tmp.data)
}

test('getList', async () => {
    const p = await provider()
    expect((await p.getList('northwind/EMPLOYEES', {
        pagination: { page: 1, perPage: 5 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })).data[0].LAST_NAME).toBe('Buchanan')
})

test('getList 2', async () => {
    const p = await provider()
    expect((await p.getList('northwind/EMPLOYEES', {
        pagination: { page: 2, perPage: 5 },
        sort: { field: 'LAST_NAME', order: 'ASC' },
        filter: undefined
    })).data[0].LAST_NAME).toBe('King')
})

test('getOne', async () => {
    const p = await provider()
    expect((await p.getOne('northwind/EMPLOYEES', { /* array index, not EMP_ID */ id: 1 })).data.LAST_NAME).toBe('Fuller')
})
