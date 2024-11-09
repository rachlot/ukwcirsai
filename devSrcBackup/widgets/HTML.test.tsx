/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { AdminContext } from "react-admin";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import HTML from "./HTML";

test('displayEmpty', async () => {
    const x = render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <HTML widget={{}}></HTML>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        expect(x).not.toBeUndefined()
    });
})