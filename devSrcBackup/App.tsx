import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router";
import { dataProvider } from "./api/DjDataProvider";
import { Page } from "./page/Page";
import { Search } from "./page/Search";
import { TablePage } from "./page/TablePage";
import { util } from "./api/Util";
import { RecordPage } from "./page/RecordPage";
import MyLayout from "./MyLayout";
import LoginPage from "./login/LoginSetupPage";
import authProvider from "./login/AuthProvider";
import authCallback from "./login/AuthCallback";
import { profile } from "./api/Profile";
import { Navigate } from "react-router-dom";
import { ToolbarPage } from "./page/ToolbarPage";
import { createContext, useState } from "react";
import { render } from "./api/Render";
import { ThemeProvider } from '@mui/material/styles';
import defaultTheme from './styles/theme/defaultTheme'

/**
 * global context to indicate whether we are in edit mode
 */
export const EditContext = createContext<boolean>(false)

/**
 * global context for container foreach value
 */
export const ValueContext = createContext<any>(undefined)

/**
 * main react admin entry component
 */
const App = () => {

  const [, setDdl] = useState(0)
  render.setDdl = () => setDdl(Date.now())

  const [edit, setEdit] = useState(false);
  render.setEdit = setEdit

  const [, setProfileLoaded] = useState(false);
  render.setProfileLoaded = setProfileLoaded

  const getTables = async (): Promise<any> => {
    try {
      return await dataProvider.tableLabels()
    }
    catch (error) {
      return Promise.resolve([])
    }
  }

  return <EditContext.Provider value={edit}>
    <Admin
      disableTelemetry
      dataProvider={dataProvider}
      theme={profile.getUISettings().theme}
      darkTheme={profile.getUISettings().darkTheme}
      layout={MyLayout}
      loginPage={LoginPage}
      authProvider={authProvider} authCallbackPage={authCallback}
      requireAuth={true}
      dashboard={() => <Navigate to={profile.getUISettings().homepage}></Navigate>}
    >
       
      {async (permissions: any) => {
        const tables = await getTables()
        let i = 0
        return <>
          {Object.keys(tables).map((t: string) => <Resource
            key={i++}
            name={util.toResource(util.parseTableID(t))}
            list={TablePage}
            edit={RecordPage}
            recordRepresentation={tables[t] ? (record) => t === 'dj/config/Property' ? (record.title ? record.title : record.ID) : util.label(tables[t], record) : undefined}
          />)}
          <CustomRoutes>
            { /* TODO: this implies that 'search' and 'page' are no legal db names */}
            <Route path="search/*" element={<Search />}></Route>
            <Route path="page/*" element={<Page></Page>}></Route>
            <Route path="config/widget/dj-toolbar" element={<ToolbarPage></ToolbarPage>}></Route>
            <Route path="config/widget/dj-sidenav" element={<ToolbarPage></ToolbarPage>}></Route>
          </CustomRoutes>
          <CustomRoutes noLayout>
            <Route path="full/*" element={<Page />}></Route>
          </CustomRoutes>
        </>
      }}

    </Admin>
  </EditContext.Provider>
}

export default App;
