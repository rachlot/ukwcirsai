import { Icon, IconButton, Tooltip } from "@mui/material";
import { useContext, useState } from "react";
import { useSubscribe, util } from "../api/Util";
import { useLoc } from "../hooks/useLoc";
import { EditContext } from "../App";
import { render } from "../api/Render";
import { useRefresh } from "react-admin";
import { useLocation } from "react-router"

/**
 * widget to turn on layout edit mode
 */
function LayoutEditSwitch() {

    const loc = useLoc()
    const refresh = useRefresh()
    const { pathname } = useLocation()

    const [dirty, setDirty] = useState(false);
    const edit = useContext(EditContext)

    // dirty signal cannot be handled via context (causes an initial reload which interferes with the editor)
    // as a workaround, use pub / sub
    useSubscribe('dj/Page/dirty', () => setDirty(true))

    // react-dom v6 does not support usePrompt to prohibit browser back during edit 
    // https://reactrouter.com/en/main/upgrading/v5#prompt-is-not-currently-supported
    // we disable links on the UI
    // a browser back / forward is detected here - leave edit mode
    if (edit && pathname !== render.pathname)
        setTimeout(() => render.endEdit())

    if (edit)
        return <>
            {!loc.database || !util.isDefaultLayout ? <Tooltip title={loc.page ? 'Delete page' : 'Delete custom layout'}><IconButton
                onClick={async () => {
                    if (window.confirm('Are you sure you want to ' + (loc.page ? 'delete the page' : 'delete the custom layout') + '?')) {
                        await render.del()
                        render.endEdit()
                        if (loc.page)
                            window.history.back()
                    }
                }}
                color="inherit"
                sx={{ marginRight: '24px' }}>
                <Icon>delete</Icon>
            </IconButton></Tooltip> : <IconButton disabled={true}><Icon>delete</Icon></IconButton>}
            {dirty ? <Tooltip title="Save page"><IconButton
                onClick={async () => {
                    setTimeout(async () => {
                        await render.save(util.value2widget(render.layout))
                        render.endEdit()
                        refresh()
                    }, render.editingJsonata ? 1000 : 0)
                }}
                color="inherit">
                <Icon>save</Icon>
            </IconButton></Tooltip> : <IconButton disabled={true}><Icon>save</Icon></IconButton>}
            <Tooltip title="Leave edit mode"><IconButton
                onClick={() => {
                    render.endEdit()
                }}
                color="inherit">
                <Icon>cancel</Icon>
            </IconButton></Tooltip>
        </>
    else
        return <Tooltip title="Edit page layout"><IconButton
            id='edit'
            onClick={() => {
                render.startEdit(pathname);
            }}
            color="inherit">
            <Icon>edit</Icon>
        </IconButton></Tooltip>
}

export default LayoutEditSwitch
