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
import { useSchema } from "./useSchema";

const queryClient = new QueryClient()

const Comp = () => {
    const { data, isLoading, error } = useSchema();
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <p>{data.ID}</p>
}

test('useSchema', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <ResourceContextProvider value='northwind/CITY'>
                <QueryClientProvider client={queryClient}>
                    <Comp></Comp>
                </QueryClientProvider>
            </ResourceContextProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('dj/northwind/CITY')) as any).toBeInTheDocument();
    });
})

test('useSchemaNoResource', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Cannot get schema: no resource context set')) as any).toBeInTheDocument();
    });
})
