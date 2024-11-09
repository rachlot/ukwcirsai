import { api } from "./Api"

/**
 * this class collects shared items that are set during render
 * and that do not have influence on the UI state.
 * Thus they do not need to be part of the EditContext
 */
export class Render {

    /**
     * function to save layout edits
     * set from Page, Search, TablePage, etc.
     */
    save = async (_: any) => { }

    /**
     * function to delete layout
     * set from Page, Search, TablePage, etc.
     */
    del = async () => { }

    /**
     * last layout state (the data to be saved)
     */
    layout: any

    /**
     * remember the path we were on when edit is pressed
     */
    pathname?: string

    /**
     * turns on / off edit state
     */
    setEdit = (_: boolean) => { }

    /**
     * ddl change must trigger reload
     */
    setDdl = () => { }

    /**
     * keep edit and pathname in sync
     */
    startEdit = (p: string) => {
        this.pathname = p
        this.setEdit(true)
    }

    /**
     * keep edit and pathname in sync
     */
    endEdit = () => {
        api.clearCache()
        this.pathname = undefined
        this.setEdit(false)
    }

    /**
     * called after login in order to refresh App component and use loaded themes
     */
    setProfileLoaded = (_: boolean) => { }

    /**
     * indicates that we are in the process of editing a jsonata expression in the uniform editor
     */
    editingJsonata = false
}

export const render = new Render()
