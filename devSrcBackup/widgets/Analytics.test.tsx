/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { MemoryRouter } from "react-router";
import { Analytics } from "./Analytics";

test('analyticsEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext>
            <Analytics widget={{ columns: [{} as any] }}></Analytics>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Analytics - please provide a database to run the query on')) as any).toBeInTheDocument();
    });
})
