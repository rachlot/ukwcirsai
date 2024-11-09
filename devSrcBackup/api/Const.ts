import Databases from "../uniforms/Databases"
import Expression from "../uniforms/Expression"
import Expressions from "../uniforms/Expressions"
import IconPicker from "../uniforms/IconPicker"
import Icons from "../uniforms/Icons"
import Properties from "../uniforms/Properties"
import Props from "../uniforms/Props"
import Queries from "../uniforms/Queries"
import Roles from "../uniforms/Roles"
import Styles from "../uniforms/Styles"
import Tables from "../uniforms/Tables"

/*
 * Constants for the uniforms properties that are used in multiple
 * forms. This avoids copy & pasting values and makes sure
 * a text or form element layout change is applied to all forms
 */

export const
    icon = {
        title: 'Icon',
        uniforms: {
            component: IconPicker
        }
    }

export const
    tooltip = {
        title: 'Tooltip',
        type: 'string',
    }

export const
    href = {
        title: 'Hyperlink',
        type: 'string',
    }

export const
    query = {
        title: 'Query ID from the catalog',
        uniforms: {
            component: Queries
        }
    }

export const
    chart = {
        title: 'Chart type',
        type: 'string',
        enum: ['bar', 'line', 'doughnut', 'radar', 'polarArea'],
    }

export const
    database = {
        title: 'Database',
        uniforms: {
            component: Databases
        }
    }

export const
    table = {
        title: 'Table',
        uniforms: {
            component: Tables
        }
    }

export const
    redrawInterval = {
        title: 'Redraw interval (sec)',
        type: 'number',
    }

export const
    markdown = {
        title: 'Markdown text',
        type: 'string',
        uniforms: {
            multiline: true
        },
        // eslint-disable-next-line no-template-curly-in-string
        default: '# Hello ${user} ${context}',
    }

export const
    html = {
        title: 'HTML Source',
        type: 'string',
        uniforms: {
            multiline: true
        },
        // eslint-disable-next-line no-template-curly-in-string
        default: '<h1>Hello ${user} ${context}</h1>'
    }

export const
    css = {
        widget: 'custom',
        widgetType: 'codeeditor',
        widgetOptions: { language: 'css' },
        title: 'CSS Source',
        type: 'string',
    }

export const
    script = {
        title: 'JavaScript Source',
        type: 'string',
        uniforms: {
            multiline: true
        },
    }

export const
    hideframe = {
        title: 'Hide the widget\'s card frame',
        type: 'boolean',
    }

export const
    text = {
        title: 'Element text',
        type: 'string'
    }

export const
    deleteConfirmation = {
        title: 'Optional confirmation text',
        type: 'string',
    }

export const
    title = {
        title: 'Element title on the page',
        type: 'string',
    }

export const
    perPage = {
        title: 'Default number of rows to display',
        type: 'integer',
        enum: [5, 10, 25, 50]
    }

export const
    card = {
        title: 'Display within a card',
        type: 'boolean'
    }

export const
    noDelete = {
        title: 'Hide delete button',
        type: 'boolean'
    }

export const
    _3d = {
        title: '3D Graph',
        type: 'boolean'
    }

export const
    name = {
        title: 'Input name',
        type: 'string',
    }

export const
    inputtitle = {
        title: 'Input display title',
        type: 'string',
    }

export const
    description = {
        title: 'Input description',
        type: 'string',
    }

export const
    readOnly = {
        title: 'Read only input',
        type: 'boolean',
    }

export const
    required = {
        title: 'Required input',
        type: 'boolean',
    }

export const
    format = {
        title: 'Input format (regular expression or uri, url, ipv4, email )',
        type: 'string',
    }

export const
    type = {
        title: 'Type of the input',
        type: 'string',
        enum: ['boolean', 'integer', 'number', 'string', 'array', 'object']
    }

export const
    widget = {
        title: 'Input widget',
        type: 'string',
        enum: ['boolean', 'string', 'number', 'auto complete', 'select', 'multi select', 'key value', 'password', 'textarea', 'date', 'time', 'datetime', 'file', 'binary file', 'file with metadata', 'binary file with metadata', 'voice']
    }

export const
    columns = {
        title: 'Columns to display in related table',
        type: 'array',
        items: { type: 'string' },
    }

export const
    prop = {
        title: 'Related table primary key',
        uniforms: {
            component: Props
        }
    }

export const
    display = {
        title: 'Expression',
        uniforms: {
            component: Expression
        }
    }

export const
    context = {
        title: 'Expression',
        uniforms: {
            component: Expression
        }
    }

export const
    _arguments = {
        title: 'Query arguments expression',
        uniforms: {
            component: Expression
        }
    }

export const
    graph = {
        title: 'Query is a graph query',
        type: 'boolean',
    }

export const
    expression = {
        title: 'Data gathering expression',
        uniforms: {
            component: Expression
        }
    }

export const
    options = {
        title: 'Expression to generate select options',
        uniforms: {
            component: Expression
        }
    }

export const
    roles = {
        title: 'Show only for roles',
        uniforms: {
            component: Roles
        }
    }

export const
    print = {
        title: 'Run this when clicked and display the result',
        uniforms: {
            component: Expression
        }
    }

export const
    navigate = {
        title: 'Run this when clicked and navigate to the URL returned',
        uniforms: {
            component: Expression
        }
    }

export const
    _if = {
        title: 'Show this container only if the following is true',
        uniforms: {
            component: Expression
        }
    }

export const
    foreach = {
        title: 'Show child for each result',
        type: 'string',
        widget: 'custom',
        widgetType: 'expression',
    }

export const
    layout = {
        title: 'Layout direction of the container\'s elements',
        type: 'string',
        enum: ['vertical', 'horizontal'],
    }

export const
    pageLayout = {
        title: 'Overall page layout',
        type: 'string',
        enum: ['1 column', '2 column', '3 column', 'T 2 column', 'T 3 column', 'horizontal', 'grid'],
    }

export const
    _class = {
        type: 'array',
        items: { type: 'string' },
        layout: 'chips',
        style: { width: '365px' },
        title: 'CSS classes applied to child elements',
    }

export const
    style = {
        uniforms: {
            component: Styles
        },
        title: 'CSS / chart styles applied to child elements',
    }

export const
    action = {
        uniforms: {
            component: Expressions
        },
        title: 'Table actions',
    }

export const
    icons = {
        uniforms: {
            component: Icons
        },
        title: 'Icons to be used for a given key',
    }

// TODO: remove
export const
    properties = {
        uniforms: {
            component: Properties
        },
        title: 'Optional input for button action',
    }

export const
    clearCache = {
        title: 'Clear the cache',
        type: 'boolean',
        description: 'Check if your expression makes changes to the database',
    }

    export const
    header = {
        title: 'Header',
        type: 'string'
    }
    export const
    subTitle = {
        title: 'Subtitle',
        type: 'string'
    }

