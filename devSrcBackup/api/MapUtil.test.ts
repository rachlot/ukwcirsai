/**
 * @jest-environment jsdom
 */
import { expect, test } from "@jest/globals";
import { mapUtil } from "./MapUtil";
import { localStorageMock } from "./Util.test";

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

test('cast', () => {
    expect(mapUtil.cast('city')).toEqual({ points: [{ address: 'city' }] })
    expect(mapUtil.cast(['a', 'b'])).toEqual({ points: [{ address: 'a' }, { address: 'b' }] })
    expect(mapUtil.cast([0, 1])).toEqual({ points: [{ location: { lat: 0, lon: 1 } }] })
})

test('zoom', () => {
    expect(mapUtil.defaultZoom([{
        location: {
            lat: 0,
            lon: 1
        }
    },
    {
        location: {
            lat: 1,
            lon: 0
        }
    }])).toBe(11)
})

test('zoomempty', () => {
    mapUtil.defaultZoom(undefined as any)
})

test('center', () => {
    expect(mapUtil.center([{
        location: {
            lat: 0,
            lon: 1
        }
    },
    {
        location: {
            lat: 1,
            lon: 0
        }
    }])).toEqual({ lat: 0.5, lon: 0.5 })
})

test('centerempty', () => {
    mapUtil.center(undefined as any)
})

test('getLocation', async () => {
    expect((await mapUtil.getLocation('DE')).boundingbox[0]).toBe(47.2701114)
})