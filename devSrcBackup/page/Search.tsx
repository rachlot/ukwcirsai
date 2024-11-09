import { useDataProvider, useGetOne } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { EditorLayout } from "./EditorLayout";
import { useLoc } from "../hooks/useLoc";
import { PrintError } from "../components/PrintError";

/**
 * renders the search page
 */
export const Search = () => {
    const dataProvider = useDataProvider()
    const { data, isLoading, error } = useGetOne('config/page', { id: 'search' });
    const loc = useLoc();

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    document.title = loc.search!

    // return <Layout widget={data.layout} />
    return <EditorLayout widget={data.layout} del={async () => {
        await dataProvider.delete('config/page', {
            id: 'search'
        })
    }} save={async (edit) => {
        await dataProvider.update('config/page', {
            id: 'search',
            data: {
                id: 'search',
                ID: 'search',
                layout: edit
            },
            previousData: data
        })
    }} />
}