/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { QueryClient } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import EditRelated from "./EditRelated";

const queryClient = new QueryClient()

test('testEditRelatedEmpty', async () => {
    render(<MemoryRouter initialEntries={["/northwind/EMPLOYEES/2"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <EditRelated widget={{}}>test</EditRelated>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('EditRelated: please provide the property that relates the children to this record')) as any).toBeInTheDocument();
    });
})

test('testEditRelatedNotOnPage', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <EditRelated widget={{}}>test</EditRelated>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('The EditRelated widget can only be used on record pages')) as any).toBeInTheDocument();
    });
})
