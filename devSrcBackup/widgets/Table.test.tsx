/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { DataProviderContext, ResourceContextProvider } from "ra-core";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import Table from "./Table";
import { AdminContext } from "react-admin";

const queryClient = new QueryClient()

test('testTableEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Table widget={{}}></Table>)
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Table - please provide a query or expression')) as any).toBeInTheDocument();
    });
})

test('testAllTable', async () => {
    render(<MemoryRouter initialEntries={["/northwind/CITY"]}>
        <AdminContext>
            <DataProviderContext.Provider value={dataProvider}>
                <ResourceContextProvider value='northwind/CITY'>
                    <QueryClientProvider client={queryClient}>
                        <Table widget={{}}></Table>)
                    </QueryClientProvider>
                </ResourceContextProvider>
            </DataProviderContext.Provider>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Los Angeles')) as any).toBeInTheDocument();
    });
})

test('testQueryTable', async () => {
    render(<MemoryRouter initialEntries={["/northwind/CITY"]}>
        <AdminContext>
            <DataProviderContext.Provider value={dataProvider}>
                <ResourceContextProvider value='northwind/CITY'>
                    <QueryClientProvider client={queryClient}>
                        <Table widget={{ expression: '[{"xyz":111}]' }}></Table>)
                    </QueryClientProvider>
                </ResourceContextProvider>
            </DataProviderContext.Provider>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        // first letter is capitalized
        (expect(screen.getByText('xyz')) as any).toBeInTheDocument();
        (expect(screen.getByText('111')) as any).toBeInTheDocument();
    });
})

test('testSearchTable', async () => {
    render(<MemoryRouter initialEntries={["/search/fulle"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Table widget={{}}></Table>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('LAST_NAME')) as any).toBeInTheDocument();
        (expect(screen.getByText('Fuller')) as any).toBeInTheDocument();
    });
})

test('testQueryTableArgs', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Table widget={{ database: 'northwind', query: 'list', arguments: '{ "limit": 1, "offset": 1 }' }}></Table>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('#2')) as any).toBeInTheDocument();
    });
})

test('testQueryGraph', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Table widget={{ database: '*', query: 'cypher', graph: true }}></Table>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        const x = screen.getAllByText('Buchanan')[0];
        (expect(x) as any).toBeInTheDocument()
    });
})
