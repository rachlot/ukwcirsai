/**
 * @jest-environment jsdom
 */
import { api } from "./Api"
import { expect, test } from '@jest/globals';
import { action, actions } from "./Action";
import { localStorageMock } from "./Util.test";

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

test('crud', async () => {
    for (const fn of await api.get<any>('http://localhost:8080/rest/manage/getFunctions')) {
        let name = fn.function.substring(1)
        if (name.endsWith('(...)'))
            name = 'call'
        // console.log(name)
        expect(Object.keys(actions).includes(name)).toBeTruthy()
    }
})

test('isAction', () => {
    expect(action.isAction('$navigate("..")')).toBeTruthy()
    expect(action.isAction('$index()')).toBeFalsy()
    expect(action.isAction('($index(); $log("test")) ')).toBeTruthy()
})

