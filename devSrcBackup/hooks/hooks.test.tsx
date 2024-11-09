/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from "react-router";
import { useLoc } from "./useLoc";

const Comp = () => {
    const loc = useLoc()
    return <>
        <p>{loc.type}</p>
        <p>{loc.id}</p>
        <p>{loc.table}</p>
    </>
}

test('useLoc', () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <Comp></Comp>
    </MemoryRouter>);
    (expect(screen.getByText('page')) as any).toBeInTheDocument();
})

test('useLoc2', () => {
    render(<MemoryRouter initialEntries={["/search/Fuller"]}>
        <Comp></Comp>
    </MemoryRouter>);
    (expect(screen.getByText('search')) as any).toBeInTheDocument();
})

test('uri encode', () => {
    render(<MemoryRouter initialEntries={["/config/dj-database/dj%2Fnorthwind"]}>
        <Comp></Comp>
    </MemoryRouter>);
    (expect(screen.getByText('resource')) as any).toBeInTheDocument();
    (expect(screen.getByText('dj/northwind')) as any).toBeInTheDocument();
})

test('uri encode2', () => {
    render(<MemoryRouter initialEntries={["/config/a%2Fb"]}>
        <Comp></Comp>
    </MemoryRouter>);
    (expect(screen.getByText('table')) as any).toBeInTheDocument();
    (expect(screen.getByText('a/b')) as any).toBeInTheDocument();
})
