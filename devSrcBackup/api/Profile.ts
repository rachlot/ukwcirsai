import { defaultDarkTheme, defaultTheme } from "react-admin";
import { merge } from 'lodash'

/**
 * various UI settings
 */
export interface UISettings {
    homepage: string
    logoUrl: string
    sideNavOpen: boolean
    theme: any
    darkTheme: any
}

/**
 * handles profile settings that are stored in the browser and that are initialized upon login
 */
class Profile {

    /**
     * null safe get JSON from session store
     */
    session(field: string): any {
        const res = sessionStorage.getItem(field)
        return res ? JSON.parse(res) : res
    }

    /**
     * null safe get JSON from local store
     */
    local(field: string): any {
        const res = localStorage.getItem(field)
        return res ? JSON.parse(res) : res
    }

    /**
     * get variable, default to {}
     */
    getVariable(): any {
        let variable = this.session('variable')

        // in a new broser tab, this might be null
        if (variable === null)
            variable = this.local('settings')

        return variable ? variable : {}
    }

    /**
     * set the variable object
     */
    setVariable(variable: object) {
        sessionStorage.setItem('variable', JSON.stringify(variable));
    }

    /**
     * translates the DB config settings into objects / values that can be used on the UI
     */
    getUISettings(): UISettings {
        const variable = this.getVariable()

        let allowDarkMode = variable['allow-dark-mode']
        if (allowDarkMode === 'false')
            allowDarkMode = false

        const res: any = {
            // should not happend but introduce failsafe to avoid / refresh loop
            homepage: variable.homepage ? variable.homepage : '/page/Home',
            logoUrl: variable['logo-url'],
            sideNavOpen: variable['sidenav-open'],
            theme: merge({
                ...defaultTheme,
                sidebar: {
                    width: variable['sidenav-width-px'],
                    closedWidth: 0,
                },
            }, variable.theme),
        }

        if (allowDarkMode) {
            res.darkTheme = merge({
                ...defaultDarkTheme,
                sidebar: {
                    width: variable['sidenav-width-px'],
                    closedWidth: 0,
                }
            }, variable['dark-theme'])
        }

        return res
    }

    /**
     * get user roles array, default to []
     */
    getRoles() {
        const roles = this.local('roles')
        return roles ? roles : []
    }

    getEmail() {
        return localStorage.email
    }

    getUser() {
        return this.local('token')?.name
    }

    /**
     * checks whether the session role is contained in the roles defined given
     */
    isInRoles(edit: boolean, roles?: string[]): boolean {
        if (edit)
            return true
        if (roles && roles.length > 0) {
            const sr = this.getRoles()
            for (const role of roles) {
                if (sr?.includes(role)) {
                    return true;
                }
            }
            return false;
        } else {
            // no role specified - access ok
            return true;
        }
    }
}

export const profile = new Profile()
