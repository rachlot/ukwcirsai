import React, { useContext } from "react";

export const TableContext = React.createContext(undefined)

export const useTableContext = () => {
    return useContext(TableContext)
}