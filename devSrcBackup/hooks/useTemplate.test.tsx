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
import { useTemplate } from "./useTemplate";

const queryClient = new QueryClient()

const Comp = ({ template, expression }: { template: string, expression: string }) => {
    const { data, isLoading, error } = useTemplate(template, expression);
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <p>{data}</p>
}

test('useTemplate', async () => {
    /* eslint-disable */
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Comp template="_${context}_" expression='1+2'></Comp>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    /* eslint-enable */
    await waitFor(() => {
        (expect(screen.getByText('_3_')) as any).toBeInTheDocument();
    });
})
