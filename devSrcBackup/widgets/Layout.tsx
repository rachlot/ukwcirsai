import { Loading } from "ra-ui-materialui";
import { createElement, ReactElement, useContext } from "react"
import Todo from "../components/Todo";
import { Widget } from "../model/widget";
import { WidgetLoader } from "./WidgetLoader";
import { Button } from "./Button";
import Card from "./Card";
import Chart from "./Chart";
import Container from "./Container";
import { Create } from "./Create";
import Display from "./Display";
import { Edit } from "./Edit";
import Expansion from "./Expansion";
import Icon from "./Icon";
import LayoutEditSwitch from "./LayoutEditSwitch";
import { Links } from "./Links";
import Map from "./Map";
import { Markdown } from "./Markdown";
import Search from "./Search";
import { Table } from "./Table";
import Text from "./Text";
import Toolbar from "./Toolbar";
import { TreeRoot } from "./Tree";
import Variable from "./Variable";
import Notebook from "./Notebook";
import EditRelated from "./EditRelated";
import HTML from "./HTML";
import Input from "./Input";
import { useFormContext } from 'react-hook-form';
import Diagram from "./Diagram";
import { Upload } from "./Upload";
import ActionTable from "./ActionTable";
import { profile } from "../api/Profile";
import LayoutSwitch from "./LayoutSwitch";
import { EditContext } from "../App";
import { customWidgets } from "../CustomWidgets";
import { Graph } from "./Graph";
import AIChat from "./AIChat";
import Spreadsheet from "./Spreadsheet";
import { UploadFile } from "./UploadFile";
import { Analytics } from "./Analytics";

/**
 * component to dynamically render widgets specified in the layout.
 * this feature is mostly replaced by the layout editor, except for the sidebar and toolbar
 */
function Layout({ widget, children, compid }: { widget: Widget, children?: any, compid: string }): ReactElement {

    const ctx = useFormContext()
    const edit = useContext(EditContext)

    if (compid !== 'input' && ctx)
        return <>Widgets must not be placed within a button, variable, create, or edit widget</>

    // TODO: lookup component in registry
    let type: Function | undefined;
    if (widget) {
        if (compid === 'container')
            type = Container
        else if (compid === 'expansion')
            type = Expansion
        else if (compid === 'notebook')
            type = Notebook
        else if (compid === 'upload')
            type = Upload
        else if (compid === 'uploadfile')
            type = UploadFile
        else if (compid === 'editRelated')
            type = EditRelated
        else if (compid === 'card')
            type = Card
        else if (compid === 'toolbar')
            type = Toolbar
        else if (compid === 'text')
            type = Text
        else if (compid === 'markdown')
            type = Markdown
        else if (compid === 'html')
            type = HTML
        else if (compid === 'actionTable')
            type = ActionTable
        else if (compid === 'aichat')
            type = AIChat
        else if (compid === 'spreadsheet')
            type = Spreadsheet
        else if (compid === 'graph')
            type = Graph
        else if (compid === 'table')
            type = Table
        else if (compid === 'tree')
            type = TreeRoot
        else if (compid === 'input')
            type = Input
        else if (compid === 'chart')
            type = Chart
        else if (compid === 'analytics')
            type = Analytics
        else if (compid === 'icon')
            type = Icon
        else if (compid === 'search')
            type = Search
        else if (compid === 'create')
            type = Create
        else if (compid === 'button')
            type = Button
        else if (compid === 'variable')
            type = Variable
        else if (compid === 'edit')
            type = Edit
        else if (compid === 'map')
            type = Map
        else if (compid === 'diagram')
            type = Diagram
        else if (compid === 'links')
            type = Links
        else if (compid === 'layout-edit-switch')
            type = LayoutEditSwitch
        else if (compid === 'layout-switch')
            type = LayoutSwitch
        else if (compid === 'display')
            type = Display
        else if (compid === 'dj-toolbar' || compid === 'dj-table-metadata' || compid === 'dj-sidenav')
            type = WidgetLoader
        else if (compid === 'activity-status')
            return <></>
        else if (compid === 'sidenav-switch')
            return <></>
        else if (compid === 'spacer')
            // spacing { 'flex': '1 1 auto' } must be applied in the toolbar
            return <></>
        else
            for (const customWidget of customWidgets)
                if (compid === (customWidget as any).config.id)
                    type = (customWidget as any).widget as any

        if (!type)
            return <Todo data={widget}></Todo>
    }

    // dynamically create element <widget value={layout}></widget>
    // check role again in order to enforce it with widget fragments (no edit layout wrapper active in that case)
    if (profile.isInRoles(edit, widget.roles))
        // eslint-disable-next-line react/no-children-prop
        return type ? createElement(type as any, { widget, children, compid }) : <Loading></Loading>
    else
        return <></>
}

export default Layout
