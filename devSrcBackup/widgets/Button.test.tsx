/**
 * @jest-environment jsdom
 */

import { expect, test } from "@jest/globals";
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useNotificationContext } from "ra-core";
import { AdminContext } from "react-admin";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router";
import { dataProvider } from "../api/DjDataProvider";
import Button, { ButtonInner } from "./Button";

test('buttonTest', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext>
            <Button widget={{ text: 'ABC' }}>test</Button>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('ABC')) as any).toBeInTheDocument();
    });
})

test('buttonTestForm', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext>
            <ButtonInner value={{}} widget={{ text: 'ABC', schema: { type: 'object', properties: { myinput: { type: 'string' } } } }}>test</ButtonInner>
        </AdminContext>
    </MemoryRouter>);
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
        (expect(screen.getByText('ABC')) as any).toBeInTheDocument();
        (expect(screen.getByText('myinput')) as any).toBeInTheDocument();
    });
})

const Notifications = () => {
    const { notifications } = useNotificationContext();
    return <span>{JSON.stringify(notifications)}</span>;
};

test('buttonTestPress', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext dataProvider={dataProvider}>
            <ButtonInner value={{}} widget={{ text: 'ABC', print: '40+2' }}>test</ButtonInner>
            <Notifications></Notifications>
        </AdminContext>
    </MemoryRouter>);
    await act(async () => {
        fireEvent.focus(screen.getByRole('button'))
    })
    await act(async () => {
        fireEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
        (expect(screen.getByText('[{"message":"42","type":"info","notificationOptions":{}}]')) as any).toBeInTheDocument();
    });
})

test('buttonEmpty', async () => {
    render(<MemoryRouter initialEntries={["/page/Info"]}>
        <AdminContext>
            <Button widget={{}}>test</Button>
        </AdminContext>
    </MemoryRouter>);
    await waitFor(() => {
        (expect(screen.getByText('Run')) as any).toBeInTheDocument();
    });
})

