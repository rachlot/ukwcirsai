import { Icon } from "@mui/material";

/**
 * fake layout switch used during toolbat edit (to avoid having the button twice)
 */
const LayoutSwitch = () => {
    return <><Icon>edit</Icon></>
}

export default LayoutSwitch

/**
 * Metadata
 */
export const config = {
    id: 'layout-switch',
    // hidden in the left drawer
    hideInMenu: true,
}
