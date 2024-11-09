import { Link, Loading } from "ra-ui-materialui";
import { util } from "../api/Util";
import { PrintError } from "./PrintError";
import { useEffect, useState } from "react";
import { dataProvider } from "../api/DjDataProvider";

/**
 * displays a PK or FK
 * 
 * LinkValue might be called from within a const data provider,
 * therefore the regular useGetOne hook does not work.
 * Write it "by hand" according to this example
 * https://marmelab.com/react-admin/doc/3.19/Actions.html
 */
export const LinkValue = ({ data, prop, pagePar }: { data: any, prop: { database: string, table: string }, pagePar?: string }) => {

    // lookup table 
    const [table, setTable] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();
    useEffect(() => {
        dataProvider.getOne('config/Table', { id: 'dj/' + prop.database + '/' + util.encodeTableOrColumnName(prop.table) })
            .then(({ data }) => {
                setTable(data);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            })
    }, [prop.database, prop.table]);
    if (loading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    pagePar = pagePar ? '?page=' + encodeURIComponent(pagePar) : ''

    if (table?.['dj-label'])
        return <LinkValueLabel label={table?.['dj-label']} data={data} prop={prop} pagePar={pagePar}></ LinkValueLabel>
    else
        return <Link target={window.location.hash.startsWith('#/config/dj-query-catalog') ? '_blank' : undefined} to={'/' + prop.database + '/' + encodeURIComponent(prop.table) + '/' + encodeURIComponent(data) + pagePar}>{data}</Link>
}

/**
 * displays a PK or FK by taking dj-label into account
 */
const LinkValueLabel = ({ data, label, prop, pagePar }: { data: any, label: string, prop: { database: string, table: string }, pagePar: string }) => {
    const [record, setRecord] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();
    useEffect(() => {
        dataProvider.getOne(prop.database + '/' + util.encodeTableOrColumnName(prop.table), { id: data })
            .then(({ data }) => {
                setRecord(data);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            })
    }, [data, prop.database, prop.table]);
    if (loading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (prop.database === 'config' && prop.table === 'Table') {
        const x = util.parseTableID(data)
        return <Link target={window.location.hash.startsWith('#/config/dj-query-catalog') ? '_blank' : undefined} to={'/' + x.database + '/' + encodeURIComponent(x.table) + pagePar}>{util.label(label, record) ? util.label(label, record) : data}</Link>
    }
    else
        return <Link target={window.location.hash.startsWith('#/config/dj-query-catalog') ? '_blank' : undefined} to={'/' + prop.database + '/' + encodeURIComponent(prop.table) + '/' + encodeURIComponent(data) + pagePar}>{util.label(label, record) ? util.label(label, record) : data}</Link>
}
