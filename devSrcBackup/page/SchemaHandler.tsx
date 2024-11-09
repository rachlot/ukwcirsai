import { Loading } from "react-admin"
import { util } from "../api/Util"
import { PrintError } from "../components/PrintError"
import { useSchema } from "../hooks/useSchema"
import { Widget } from "../model/widget"
import { EditorLayout } from "./EditorLayout"

/**
 * This element materializes the default schema for edit and create widgets
 * such that they show up in the editor
 * 
 * upon save, the default schema is removed from the JSON tree unless
 * it was changed in the editor
 */
export const SchemaHandler = ({ widget, save, del }: { widget: Widget, save: (data: any) => Promise<void>, del: () => Promise<void> }) => {
    const { data, isLoading, error } = useSchema()
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (data.required)
        for (const r of data.required)
            data.properties![r].required = true as any

    for (const prop of Object.values(data.properties))
        if (!(prop as any).size)
            (prop as any).size = 3

    // the last row "expands" to size 12
    // adjust here in order to avoid an artificial edit
    const arr: any[] = Object.values(data.properties)
    const adjustLast = arr.length % 4
    if (adjustLast === 1)
        arr[arr.length - 1].size = 12
    if (adjustLast === 2) {
        arr[arr.length - 1].size = 6
        arr[arr.length - 2].size = 6
    }
    if (adjustLast === 3) {
        arr[arr.length - 1].size = 4
        arr[arr.length - 2].size = 4
        arr[arr.length - 3].size = 4
    }

    /**
     * add default schema unless custom schema is specified
     */
    const materializeSchema = (widget: Widget) => {
        if (widget.widget === 'create' || widget.widget === 'edit')
            if ((widget.schema && Object.keys(widget.schema).length > 0) || data.properties?.djClassName || data.ID === 'dj/config/dj-config')
                // use default form behavior where fields cannot be edited
                return
            else
                // use table schema for the form
                widget.schema = { type: 'object', properties: data.properties }
        else
            if (widget.children)
                for (const child of widget.children)
                    materializeSchema(child)
    }

    /**
     * remove default schema - keep it if the user changed it
     */
    const removeSchema = (widget: Widget) => {
        if (widget.widget === 'create' || widget.widget === 'edit')
            if (widget.schema && util.schemaEquals(widget.schema, data))
                // no change was made, keep default
                delete widget.schema
            else
                // keep the form changes and save them
                return
        else
            if (widget.children)
                for (const child of widget.children)
                    removeSchema(child)
    }

    materializeSchema(widget)

    /**
     * intercept save and remove schema if it is still the default
     */
    return <EditorLayout widget={widget} save={(data: any) => {
        removeSchema(data)
        return save(data)
    }} del={del}></EditorLayout>
}