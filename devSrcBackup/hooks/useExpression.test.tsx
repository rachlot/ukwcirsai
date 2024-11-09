/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { DataProviderContext, ResourceContextProvider } from "ra-core";
import { Loading } from "react-admin";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import { PrintError } from "../components/PrintError";
import { useExpression } from "./useExpression";

const queryClient = new QueryClient()

const Comp = ({ expression }: { expression: string }) => {
    const { data, isLoading, error } = useExpression(false, expression);
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <p>{JSON.stringify(data)}</p>
}

test('useExpressionSimple', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp expression={'1+2'}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('3')) as any).toBeInTheDocument();
    });
})

test('useExpressionRead', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp expression={'$read("northwind", "EMPLOYEES", 2).LAST_NAME'}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('"Fuller"')) as any).toBeInTheDocument();
    });
})

test('useExpressionContext', async () => {
    render(<MemoryRouter initialEntries={["/northwind/EMPLOYEES/2"]}>
        <ResourceContextProvider value="northwind/EMPLOYEES">
            <DataProviderContext.Provider value={dataProvider}>
                <QueryClientProvider client={queryClient}>
                    <Comp expression={'$read(database, table, pk1).LAST_NAME'}></Comp>
                </QueryClientProvider>
            </DataProviderContext.Provider>
        </ResourceContextProvider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('"Fuller"')) as any).toBeInTheDocument();
    });
})
