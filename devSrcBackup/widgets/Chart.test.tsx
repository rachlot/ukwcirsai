/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import Chart from "./Chart";

test('testChartEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <Chart widget={{}}></Chart>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Chart - please provide a query or expression')) as any).toBeInTheDocument();
    });
})