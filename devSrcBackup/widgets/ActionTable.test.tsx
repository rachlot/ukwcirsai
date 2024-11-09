/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import ActionTable from "./ActionTable";

test('actionTableEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext>
            <ActionTable widget={{}}></ActionTable>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('ActionTable - please provide an expression that computes a table')) as any).toBeInTheDocument();
    });
})

test('actionTableIllegal', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <ActionTable widget={{ expression: '123' }}></ActionTable>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('No data available')) as any).toBeInTheDocument();
    });
})

test('actionTableIllegal2', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <ActionTable widget={{ expression: '[123]' }}></ActionTable>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('No data available')) as any).toBeInTheDocument();
    });
})

test('actionTableDisplay', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <ActionTable widget={{ expression: '[{"x":123}]' }}></ActionTable>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('123')) as any).toBeInTheDocument();
    });
})
