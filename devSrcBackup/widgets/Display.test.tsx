/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import Display from "./Display";

test('displayExpression', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <Display widget={{ display: '40+2' }}></Display>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('42')) as any).toBeInTheDocument();
    });
})

test('displayEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <Display widget={{}}></Display>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Display - please edit display expression')) as any).toBeInTheDocument();
    });
})