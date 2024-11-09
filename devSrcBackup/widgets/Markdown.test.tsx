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
import Markdown from "./Markdown";

const queryClient = new QueryClient()

test('markdownTemplateExpression', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Markdown widget={{ markdown: '-${context.res}-', context: '{"res":4-2}' }}></Markdown>)
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('-2-')) as any).toBeInTheDocument();
    });
})

test('markdownTemplate', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Markdown widget={{ markdown: '# Title' }}></Markdown>)
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Title')) as any).toBeInTheDocument();
    });
})

test('markdownReplaceLink', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Markdown widget={{ markdown: '<a href="/#/resource/Go">Link</a>' }}></Markdown>)
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', '/#/Go');
    });
})

test('markdownEmpty', async () => {
    const x = render(<MemoryRouter initialEntries={["/page/Info"]}>
        <DataProviderContext.Provider value={dataProvider}>
            <QueryClientProvider client={queryClient}>
                <Markdown widget={{}}></Markdown>)
            </QueryClientProvider>
        </DataProviderContext.Provider>
    </MemoryRouter>);
    await waitFor(() => {
        expect(x).not.toBeUndefined()
    })
})