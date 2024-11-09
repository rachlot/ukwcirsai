import { Icon } from '@mui/material';
import { Create as C, Loading } from "ra-ui-materialui";
import { title } from "../api/Const";
import { util } from "../api/Util";
import { EditForm } from "../form/EditForm";
import { useSchema } from "../hooks/useSchema";
import { Widget } from "../model/widget";
import { PrintError } from "../components/PrintError";

/**
 * create a new record
 */
export const Create = ({ children, widget }: { children: any, widget: Widget }) => {
    const { data, isLoading, error } = useSchema();
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    const schema = util.defaultSchema(children, data)

    return <C sx={{ marginBottom: '10px' }}>
        <EditForm schema={schema} label={widget.text ? widget.text : 'Create'} >{schema?.ID === 'dj/config/dj-function' || schema?.ID === 'dj/config/dj-database' || schema?.ID === 'dj/config/dj-config' ? [] : children}</EditForm>
    </C>
}

export default Create

export const config = {
    id: 'create',
    title: 'Create',
    description: 'Create a new record',
    version: 1,
    icon: <Icon>add_circle</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
            }
        }
    }
}