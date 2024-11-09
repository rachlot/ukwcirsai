import { useDataProvider, useGetOne, useRefresh } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { useLoc } from "../hooks/useLoc";
import { EditorLayout } from "./EditorLayout";
import { PrintError } from "../components/PrintError";
import { profile } from "../api/Profile";
import Button from '@mui/material/Button';

/**
 * component that loads a Page layout using the browser location
 * and renders the page
 */
export const Page = () => {
    const refresh = useRefresh()
    const loc = useLoc();
    const dataProvider = useDataProvider()
    const page = loc.withPage ? loc.withPage : loc.page
    const { data, isLoading, error } = useGetOne('config/page', { id: page });

    if (isLoading) return <Loading />
    if (error) {
        if (profile.isInRoles(false, ['admin']))
            return <Button sx={{ margin: '10px', width: '200px' }} variant="contained" onClick={async () => {
                await dataProvider.create('config/page', {
                    data: {
                        ID: page
                    },
                })
                refresh()
            }}>Create Page</Button>
        return <PrintError error={error}></PrintError>
    }
    // handle new page where layout = null
    if (data && !data.layout)
        data.layout = {
            widget: 'page',
            children: [{ widget: 'text', title: 'New page' }]
        }

    document.title = page!

    // return <Layout widget={data.layout} />
    return <EditorLayout widget={data.layout} del={async () => {
        await dataProvider.delete('config/page', {
            id: page!
        })
    }} save={async (edit) => {
        await dataProvider.update('config/page', {
            id: page!,
            data: {
                id: page,
                ID: page,
                layout: edit
            },
            previousData: data
        })
    }} />
}
