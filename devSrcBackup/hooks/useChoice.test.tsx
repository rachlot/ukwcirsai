/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { DataProviderContext } from "ra-core";
import { Loading } from "react-admin";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import { PrintError } from "../components/PrintError";
import { Schema } from "../model/schema";
import { useChoices } from "./useChoices";

const queryClient = new QueryClient()

const Comp = ({ schema }: { schema: Schema }) => {
    const { data, isLoading, error } = useChoices(schema);
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <p>{JSON.stringify(data)}</p>
}

test('useChoicesJsonata', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp schema={{ type: 'object', jsonata: '[1,2,3]' }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('[{"id":1,"name":1},{"id":2,"name":2},{"id":3,"name":3}]')) as any).toBeInTheDocument();
    });
})

test('useChoicesEnum', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp schema={{ type: 'object', enum: [1, 2, 3] }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('[{"id":1,"name":1},{"id":2,"name":2},{"id":3,"name":3}]')) as any).toBeInTheDocument();
    });
})

test('useChoicesChoices', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp schema={{ type: 'object', choices: [{ value: 1, name: 1 }] }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('[{"id":1,"name":1}]')) as any).toBeInTheDocument();
    });
})

test('useChoicesChoices2', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp schema={{ type: 'object', choices: [1] }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('[{"id":1,"name":1}]')) as any).toBeInTheDocument();
    });
})

test('useChoicesUrl', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp schema={{ type: 'object', choicesUrl: '/rest/database/all/config/dj-role', jsonata: 'ID' }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('[{"id":"authenticated","name":"authenticated"},{"id":"admin","name":"admin"}]')) as any).toBeInTheDocument();
    });
})

test('useChoicesAll', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp schema={{ type: 'object', options: '[$read("config", "dj-database", "dj/config").name]' }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('[{"id":"config","name":"config"}]')) as any).toBeInTheDocument();
    });
})