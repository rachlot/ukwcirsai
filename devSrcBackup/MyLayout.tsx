import { Layout, useSidebarState } from 'react-admin';
import { SideMenu } from './page/SideMenu';
import { Toolbar } from './page/Toolbar';
import { useEffect } from 'react';
import { profile } from './api/Profile';

/**
 * layout with custom toolbar and side menu
 */
const MyLayout = (props: any) => {

    // run this once to apply sideNavOpen
    const [, setOpen] = useSidebarState()
    useEffect(() => setOpen(profile.getUISettings().sideNavOpen), [setOpen])

    return <Layout
        {...props}
        appBar={Toolbar}
        menu={SideMenu}
    />
};

export default MyLayout;