import Typography from '@mui/material/Typography';
import Editor from '@react-page/editor';
import '@react-page/editor/lib/index.css';
import '@react-page/plugins-slate/lib/index.css';
import { useContext, useState } from "react";
import { util } from "../api/Util";
import { Widget } from "../model/widget";
import { config as ActionTable } from "../widgets/ActionTable";
import { config as AIChat } from "../widgets/AIChat";
import { config as Button } from "../widgets/Button";
import { config as Card } from "../widgets/Card";
import { config as Chart } from "../widgets/Chart";
import { config as Container } from "../widgets/Container";
import { config as Create } from "../widgets/Create";
import { config as Diagram } from "../widgets/Diagram";
import { config as Display } from "../widgets/Display";
import { config as Edit } from "../widgets/Edit";
import { config as EditRelated } from "../widgets/EditRelated";
import { config as Expansion } from "../widgets/Expansion";
import { config as HTML } from "../widgets/HTML";
import { config as Icon } from "../widgets/Icon";
import { config as Input } from "../widgets/Input";
import { config as LayoutSwitch } from "../widgets/LayoutSwitch";
import { config as Links } from "../widgets/Links";
import { config as Map } from "../widgets/Map";
import { config as Markdown } from "../widgets/Markdown";
import { config as Notebook } from "../widgets/Notebook";
import { config as Search } from "../widgets/Search";
import { config as SidenavSwitch } from "../widgets/SidenavSwitch";
import { config as Spacer } from "../widgets/Spacer";
import { config as Spreadsheet } from '../widgets/Spreadsheet';
import { config as Table } from "../widgets/Table";
import { config as Text } from "../widgets/Text";
import { config as Tree } from "../widgets/Tree";
import { config as Upload } from "../widgets/Upload";
import { config as UploadFile } from "../widgets/UploadFile";
import { config as Variable } from "../widgets/Variable";
import { config as WidgetLoader } from "../widgets/WidgetLoader";
import { config as Graph } from '../widgets/Graph';
import { config as Analytics } from '../widgets/Analytics';

import { Paper } from '@mui/material';
import { EditContext } from "../App";
import { render } from "../api/Render";
import { TemplateText } from "../components/TemplateText";
import Layout from "../widgets/Layout";
import { customWidgets } from '../CustomWidgets';
import { useExpression } from '../hooks/useExpression';
import { Loading } from 'react-admin';
import { PrintError } from '../components/PrintError';
import { profile } from '../api/Profile';

/**
 * editor cell plugins
 */
let cellPlugins: any

/**
 * initial version of the react page layout integration
 * this component is called from the "page" components that load
 * a layout from the backend
 * it replaces the <Layout> component
 */
export const EditorLayout = ({ widget, save, del }: { widget: Widget, save: (data: any) => Promise<void>, del: () => Promise<void> }) => {

    const edit = useContext(EditContext)

    // fullscreen display used to be realized by page not being the top level node
    // now we handle it by using /full rather than /page
    if (widget.widget !== 'page')
        widget = {
            widget: 'page',
            children: [widget]
        }

    const value = util.widget2value(widget);

    // edited state
    const [layout, setLayout] = useState<any>()


    const { data, isLoading, error } = useExpression(widget.cached!, widget.onRender)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    render.del = del
    render.save = save

    if (!cellPlugins) {
        cellPlugins = [
            // Add in alphabetical order
            ActionTable,
            AIChat,
            Analytics,
            Button,
            Card,
            Chart,
            Container,
            Create,
            Diagram,
            Display,
            Edit,
            EditRelated,
            Expansion,
            Graph,
            HTML,
            Icon,
            Input,
            Links,
            Map,
            Markdown,
            Notebook,
            Spreadsheet,
            Table,
            Text,
            Tree,
            UploadFile,
            Variable,
            ...customWidgets.map((w: any) => w.config),

            // these have hideInMenu: true
            Upload, LayoutSwitch, SidenavSwitch, Spacer, WidgetLoader, Search
        ]

        for (const comp of cellPlugins) {
            const renderer = ({ data, children }: any) => {
                return <Wrapper widget={data} comp={comp}>{children}</Wrapper>
            }
            comp.Renderer = renderer
        }
    }

    return <Editor

        // vertical spacing is usually ok due to headings
        cellSpacing={{ x: 10, y: 0 }}

        // too confusing with edit mode button in the toolbar
        previewEnabled={false}

        // enable undo - drag & drop can be error prone
        undoRedoEnabled={true}

        // sometimes you cannot get to the drag handle because the controls are in the way
        zoomEnabled={true}

        // insert does not work when a widget is selected
        insertEnabled={false}

        // easier to move using D&D or editor move mode
        showMoveButtonsInBottomToolbar={false}

        cellPlugins={cellPlugins}
        value={layout ? layout : value}
        readOnly={!edit}
        onChange={(data) => {
            // return <DJEditor value={value} editMode={edit} onChange={(data) => {
            if (util.valueChanged(value.rows, data.rows)) {
                util.publish('dj/Page/dirty')
            }
            render.layout = data
            setLayout(JSON.parse(JSON.stringify(data)))
        }} />
}

const Wrapper = ({ widget, comp, children }: { widget: any, comp: any, children: any }) => {

    const edit = useContext(EditContext)

    const { data, isLoading, error } = useExpression(widget.cached!, widget.if)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // do not render
    if (widget.if && !edit)
        if (!data) return <></>

    if (!profile.isInRoles(edit, widget.roles))
        return <></>

    if (comp.id === 'input')
        // form.title not widget.title
        return <Layout widget={widget} compid={comp.id}>{children}</Layout>
    if (widget.card)
        return <>
            <Typography variant="h6"><TemplateText text={widget.title} /></Typography>
            <Paper sx={{ marginBottom: '10px', paddingLeft: '10px', paddingRight: '10px' }}>
                <Layout widget={widget} compid={comp.id}>{children}</Layout>
            </Paper>
        </>
    else
        return <>
            <Typography variant="h6"><TemplateText text={widget.title} /></Typography>
            <Layout widget={widget} compid={comp.id}>{children}</Layout>
        </>
}