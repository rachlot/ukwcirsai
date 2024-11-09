// import { config } from "./widgets/Smiles";
// import { Smiles } from "./widgets/Smiles";
import { config } from "./widgets/Button"
import HomeContainer from "./widgets/HomeContainer"
import { HomeContainerConfig } from "./widgets/HomeContainer"
import NavigationButtons from "./widgets/NavigationButtons"
import { NavigationButtonsConfig } from "./widgets/NavigationButtons"

/**
 * extension point for custom widgets
 * Please refer to the section "Developing a Custom Widget" in the documentation
 * 
 * Custom widgets is an array of objects with the following structure:
 * 
 * widget: the TSX element that gets passed the widget configuration and that draws the actual HTML
 * config: the widget metadata that contains title, icon, and the form used to edit the widget
 */
export const customWidgets = [
    // {
    //     widget: Smiles,
    //     config: config
    // }
    {
        widget: HomeContainer,
        config: HomeContainerConfig
    },
    {
        widget: NavigationButtons,
        config: NavigationButtonsConfig
    },
]