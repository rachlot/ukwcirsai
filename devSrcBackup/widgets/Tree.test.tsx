/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext, ResourceContextProvider, RecordContext } from "react-admin";
import { QueryClient } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import Tree from "./Tree";

const queryClient = new QueryClient()

test('testTreeEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Tree widget={{}}></Tree>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Tree - please provide a query or an expression')) as any).toBeInTheDocument()
    });
})

test('testTreeRec', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Tree widget={{ database: 'northwind', query: 'orgchart' }}></Tree>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Fuller')) as any).toBeInTheDocument()
    });
})

test('testTreeRecQuery', async () => {
    render(<MemoryRouter initialEntries={["/northwind/EMPLOYEE/1"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <ResourceContextProvider value='northwind/EMPLOYEES'>
                <RecordContext.Provider value={{ id: 5, EMPLOYEE_ID: 5, LAST_NAME: 'Davolio' }}>
                    <Tree widget={{ database: 'northwind', query: 'orgchart' }}></Tree>
                </RecordContext.Provider>
            </ResourceContextProvider>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Dodsworth')) as any).toBeInTheDocument()
    });
})

test('testNavTree', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Tree widget={{ database: 'config', query: 'dj-navigation' }}></Tree>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('northwind')) as any).toBeInTheDocument()
    });
})
