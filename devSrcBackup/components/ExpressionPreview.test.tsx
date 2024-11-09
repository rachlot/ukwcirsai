/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { DataProviderContext } from "ra-core";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import ExpressionPreview from "./ExpressionPreview";

const queryClient = new QueryClient()

test('expressionPreviewTest', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <ExpressionPreview expression="1+2" context={{}} foreach={false}></ExpressionPreview>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter >);
    await waitFor(() => {
        (expect(screen.getByText('3')) as any).toBeInTheDocument();
    });
})

test('expressionPreviewErrorTest', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <ExpressionPreview expression="1+" context={{}} foreach={false}></ExpressionPreview>
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter >);
    await waitFor(() => {
        (expect(screen.getByText('Unexpected end of expression')) as any).toBeInTheDocument();
    });
})

