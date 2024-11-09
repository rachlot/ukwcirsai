/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { QueryClient } from "react-query";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import Text from "./Text";

const queryClient = new QueryClient()

test('testTextEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Text widget={{}}></Text>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Text - Please provide a text')) as any).toBeInTheDocument()
    });
})

test('testTextText', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Text widget={{ text: 'My Text' }}></Text>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('My Text')) as any).toBeInTheDocument()
    });
})

test('testTextLink', async () => {
    render(<MemoryRouter initialEntries={["/page/Home"]}>
        <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
            <Text widget={{ text: 'My Text', href: 'http://dashjoin.com' }}></Text>)
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByRole('link')) as any).toHaveAttribute('href', 'http://dashjoin.com')
    });
})
