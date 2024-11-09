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
import { useDjQuery } from "./useDjQuery";

const queryClient = new QueryClient()

const Comp = ({ query, args }: { query: string, args?: any }) => {
    const { data, isLoading, error } = useDjQuery({ database: 'northwind', query }, args);
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <p>{JSON.stringify(data?.data[0])}</p>
}

test('useQueryGroup', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp query={'group'}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('{"CUSTOMERS.COUNTRY":"Argentina","Number of Customers":3}')) as any).toBeInTheDocument();
    });
})

test('useQueryList', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp query={'list'} args={{ limit: 1, offset: 1 }}></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('{"CATEGORIES.CATEGORY_ID":2,"CATEGORIES.CATEGORY_NAME":"Condiments","CATEGORIES.DESCRIPTION":"Sweet and savory sauces, relishes, spreads, and seasonings","CATEGORIES.PICTURE":""}')) as any).toBeInTheDocument();
    });
})
