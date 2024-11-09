import { useContext } from "react"
import { WidgetLoader } from "../widgets/WidgetLoader"
import { EditContext } from "../App";
import { Box } from "@mui/material";


/**
 * simply delegate to widget loader
 */
export const SideMenu = () => {

    const edit = useContext(EditContext)

    if (edit)
        return <Box sx={{ pointerEvents: 'none' }}>
            <WidgetLoader compid='dj-sidenav' />
        </Box>
    else
        return <WidgetLoader compid='dj-sidenav' />
}