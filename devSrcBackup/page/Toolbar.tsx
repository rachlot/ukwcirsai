import { useGetOne } from "ra-core";
import { AppBar, Loading } from "ra-ui-materialui"
import Layout from "../widgets/Layout";
import { PrintError } from "../components/PrintError";
import { util } from "../api/Util";
import { Legal } from "../components/Legal";
import { Box } from "@mui/material";
import { profile } from "../api/Profile";

/**
 * add our toolbar icons to ra appbar
 */
export const Toolbar = () => {

    const { data, isLoading, error } = useGetOne('config/widget', { id: 'dj-toolbar' });
    if (isLoading) return <Loading />
    if (util.error(error) === 'Network Error') return <></>
    if (error) return <PrintError error={error}></PrintError>

    const sideNavWidth = profile.getVariable()['sidenav-width-px']
    const sx = sideNavWidth === 0 ? {
        '& .RaAppBar-menuButton': { display: 'none' },
    } : undefined

    // bypass top container with activity status
    return <AppBar sx={sx}         style={{backgroundColor: "#65558F"}}
    >
        <Legal />
        {profile.getUISettings().logoUrl ? <Box
            component="img"
            sx={{ marginRight: '1em', height: 30 }}
            src={profile.getUISettings().logoUrl}
        /> : <></>}
        <Layout widget={data.layout.children[1]} compid={data.layout.children[1].widget}></Layout>
    </AppBar>
}