import { Loading, useGetOne } from "react-admin";
import { dataProvider } from "../api/DjDataProvider"
import { EditorLayout } from "./EditorLayout"
import { PrintError } from "../components/PrintError";
import { useLoc } from "../hooks/useLoc";

/**
 * special handling for widget includes dj-toolbar / sidenav / dj-table-metadata
 * 
 * we have the following cases:
 * 
 * 1) layout is a single widget (e.g. sidenav tree widget): wrap this in {page, children[]}
 * 2) layout is a container: change the widget type from container to page
 * 3) toolbar layout: use layout.children[1]
 */
export const ToolbarPage = () => {

    const loc = useLoc();
    let { data, isLoading, error } = useGetOne('config/widget', { id: loc.id });

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // deep clone the toolbar
    data = JSON.parse(JSON.stringify(data))

    // in case of the toolbar, we skip the top level activity-status
    let widget = data.layout
    if (loc.id === 'dj-toolbar')
        widget = widget.children[1]
    if (widget.widget === 'container' || widget.widget === 'toolbar')
        widget.widget = 'page'
    else
        widget = { widget: 'page', children: [widget] }

    if (Array.isArray(widget.children))
        for (const kid of widget.children)
            if (kid.widget === 'layout-edit-switch')
                kid.widget = 'layout-switch'

    return <EditorLayout widget={widget} del={async () => {
        await dataProvider.delete('config/widget', {
            id: loc.id
        })
    }} save={async (edit) => {

        if (Array.isArray(edit.children))
            for (const kid of edit.children)
                if (kid.widget === 'layout-switch')
                    kid.widget = 'layout-edit-switch'

        // edit is {page, children}
        if (loc.id === 'dj-toolbar')
            data.layout.children[1] = { widget: 'toolbar', children: edit.children }
        else
            data.layout = { widget: 'container', children: edit.children }

        await dataProvider.update('config/widget', {
            id: loc.id,
            data: {
                id: loc.id,
                ID: loc.id,
                layout: data.layout
            },
            previousData: data
        })
    }} />
}