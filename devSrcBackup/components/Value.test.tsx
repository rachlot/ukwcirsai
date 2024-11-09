/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { DataProviderContext, ResourceContextProvider } from "ra-core";
import { AdminContext } from "react-admin";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import { util } from "../api/Util";
import { Value } from "./Value";

const queryClient = new QueryClient()

test('valueSimple', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={123}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('123')) as any).toBeInTheDocument();
    });
})

test('valueArray', async () => {
    render(<AdminContext>
        <ResourceContextProvider value='northwind/CITY'>
            <DataProviderContext.Provider value={dataProvider}>
                <QueryClientProvider client={queryClient}>
                    <Value data={[1, 2, 3]}></Value>
                </QueryClientProvider>
            </DataProviderContext.Provider>
        </ResourceContextProvider>
    </AdminContext>);
    await waitFor(() => {
        (expect(screen.getByText('1')) as any).toBeInTheDocument();
        (expect(screen.getByText('2')) as any).toBeInTheDocument();
        (expect(screen.getByText('3')) as any).toBeInTheDocument();
    });
})

test('valueObject', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={{ x: 1, y: 2 }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('x')) as any).toBeInTheDocument();
        (expect(screen.getByText('1')) as any).toBeInTheDocument();
        (expect(screen.getByText('y')) as any).toBeInTheDocument();
        (expect(screen.getByText('2')) as any).toBeInTheDocument();
    });
})

test('valueObjectWithArray', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={{ o: [{ x: 1 }, { y: 2 }] }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('x')) as any).toBeInTheDocument();
        (expect(screen.getByText('1')) as any).toBeInTheDocument();
        (expect(screen.getByText('y')) as any).toBeInTheDocument();
        (expect(screen.getByText('2')) as any).toBeInTheDocument();
    });
})

test('valueTable', async () => {
    render(
        <AdminContext>
            <ResourceContextProvider value='northwind/CITY'>
                <DataProviderContext.Provider value={dataProvider}>
                    <QueryClientProvider client={queryClient}>
                        <Value data={[{ x: 1, y: 2 }]} schema={util.inferSchemaFromData([{ x: 1, y: 2 }])}></Value>
                    </QueryClientProvider>
                </DataProviderContext.Provider>
            </ResourceContextProvider>
        </AdminContext>
    );
    await waitFor(() => {
        (expect(screen.getByText('x')) as any).toBeInTheDocument();
        (expect(screen.getByText('1')) as any).toBeInTheDocument();
        (expect(screen.getByText('y')) as any).toBeInTheDocument();
        (expect(screen.getByText('2')) as any).toBeInTheDocument();
    });
})

test('valueTablePk', async () => {
    render(
        <AdminContext>
            <ResourceContextProvider value='northwind/CITY'>
                <DataProviderContext.Provider value={dataProvider}>
                    <QueryClientProvider client={queryClient}>
                        <Value data={[{ ID: 1 }]} schema={{ type: 'object', properties: { ID: { type: 'integer', pkpos: 0, ID: 'dj/northwind/CITY/ID' } } }}></Value>
                    </QueryClientProvider>
                </DataProviderContext.Provider>
            </ResourceContextProvider>
        </AdminContext >
    );
    await waitFor(() => {
        (expect(screen.getByText('#1')) as any).toBeInTheDocument();
    });
})

test('valueHref', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={{ href: 'https://dashjoin.com', label: 'Home' }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Home')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', 'https://dashjoin.com')
    });
})

test('valueHrefKeyValue', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={{ homepage: { href: 'https://dashjoin.com', label: 'Home' } }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Home')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', 'https://dashjoin.com')
    });
})

test('valueHrefKeyArray', async () => {
    render(
        <AdminContext>
            <ResourceContextProvider value='northwind/CITY'>
                <DataProviderContext.Provider value={dataProvider}>
                    <QueryClientProvider client={queryClient}>
                        <Value data={[{ href: 'https://dashjoin.com', label: 'Home' }]}></Value>
                    </QueryClientProvider>
                </DataProviderContext.Provider>
            </ResourceContextProvider>
        </AdminContext >
    );
    await waitFor(() => {
        (expect(screen.getByText('Home')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', 'https://dashjoin.com')
    });
})

test('valueImg', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={{ img: 'https://dashjoin.com' }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        // https://github.com/testing-library/dom-testing-library/issues/1235
        (expect(screen.getByRole('presentation')) as any).toHaveAttribute('src', 'https://dashjoin.com')
    });
})

test('valueLink', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={{ database: 'northwind', table: 'EMPLOYEES', pk1: 2 }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Fuller')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '/northwind/EMPLOYEES/2')
    });
})

test('valuePkDjLabel', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={2} schema={{ type: 'number', pkpos: 0, ID: 'dj/northwind/EMPLOYEES/EMPLOYEE_ID', parent: 'dj/northwind/EMPLOYEES' }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter >);
    await waitFor(() => {
        (expect(screen.getByText('Fuller')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '/northwind/EMPLOYEES/2')
    });
})

test('valuePk', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={1} schema={{ type: 'number', pkpos: 0, ID: 'dj/northwind/CITY/ID', parent: 'dj/northwind/CITY' }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter >);
    await waitFor(() => {
        (expect(screen.getByText('1')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '/northwind/CITY/1')
    });
})

test('valueFkDjLabel', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={2} schema={{ type: 'number', ref: 'dj/northwind/EMPLOYEES/EMPLOYEE_ID' }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter >);
    await waitFor(() => {
        (expect(screen.getByText('Fuller')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '/northwind/EMPLOYEES/2')
    });
})

test('valueFkDjLabelInTable', async () => {
    render(
        <AdminContext>
            <ResourceContextProvider value='northwind/CITY'>
                <DataProviderContext.Provider value={dataProvider}>
                    <QueryClientProvider client={queryClient}>
                        <Value data={[{ link: { database: 'northwind', table: 'EMPLOYEES', pk1: 2 } }]}></Value>
                    </QueryClientProvider>
                </DataProviderContext.Provider>
            </ResourceContextProvider>
        </AdminContext >
    );
    await waitFor(() => {
        (expect(screen.getByText('Fuller')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '#/northwind/EMPLOYEES/2')
    });
})

test('valueFk', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Value data={'01581'} schema={{ type: 'number', ref: 'dj/northwind/EMPLOYEE_TERRITORIES/TERRITORY_ID' }}></Value>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter >);
    await waitFor(() => {
        (expect(screen.getByText('01581')) as any).toBeInTheDocument();
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '/northwind/EMPLOYEE_TERRITORIES/01581')
    });
})

