import { useGetOne } from "ra-core";
import { Loading } from "ra-ui-materialui";
import Layout from "./Layout";
import { PrintError } from "../components/PrintError";
import { util } from "../api/Util";

/**
 * renders the search page
 */
export const WidgetLoader = ({ compid }: { compid: string }) => {
    const { data, isLoading, error } = useGetOne('config/widget', { id: compid });

    if (isLoading) return <Loading />
    if (util.error(error) === 'Network Error') return <></>
    if (error) return <PrintError error={error}></PrintError>

    return <Layout widget={data.layout} compid={data.layout.widget} />
}

export default WidgetLoader


/**
 * Metadata
 */
export const config = {
    id: 'dj-table-metadata',

    // capitalized version
    title: 'Table Metadata',

    // description in widget chooser
    description: 'Allows editing table and column metadata',
    version: 1,

    // hidden in the left drawer
    hideInMenu: true,
}