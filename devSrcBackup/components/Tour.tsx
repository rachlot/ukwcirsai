import { Icon, IconButton, Tooltip } from "@mui/material"
import { EditContext } from "../App"
import { useContext, useEffect } from "react"
import { Widget } from "../model/widget"
import 'shepherd.js/dist/css/shepherd.css';
import { useDataProvider, useNotify, useRefresh } from "ra-core";
import { useShepherdTour } from "react-shepherd";
import { useLocation, useNavigate } from "react-router";
import { util } from "../api/Util";
import { api } from "../api/Api";
import { render } from "../api/Render";
import { profile } from "../api/Profile";

/**
 * product tour that helps new users get acquainted with the platform
 */
export const Tour = ({ widget }: { widget: Widget }) => {

    const edit = useContext(EditContext)
    const dataProvider = useDataProvider()
    const notify = useNotify()
    const refresh = useRefresh()
    const navigate = useNavigate()
    const location = useLocation()

    const tour = useShepherdTour({
        tourOptions: {
            defaultStepOptions: {
                // allows exiting the tour
                cancelIcon: {
                    enabled: true,
                },
            },
            useModalOverlay: true,
        }, steps: []
    });

    // reusable buttons
    const help = {
        text: 'Docs', action: () => {
            const parts = window.location.hash.split('/')
            const loc = util.parseLoc(parts)
            let href = 'https://dashjoin.github.io/platform/latest'
            if (loc.page === 'Notebook')
                href = 'https://dashjoin.github.io/platform/latest/ai-ml-integration/#jsonata-notebooks'
            if (loc.page === 'Info')
                href = 'https://dashjoin.github.io/platform/latest/user-interface/#general-information-page'
            if (loc.database === 'config') {
                if (loc.table === 'page')
                    href = 'https://dashjoin.github.io/platform/latest/user-interface/#pages-dashboard'
                if (loc.table === 'dj-query-catalog')
                    href = 'https://dashjoin.github.io/platform/latest/user-interface/#query-catalog-and-editor'
                if (loc.table === 'dj-function')
                    href = 'https://dashjoin.github.io/platform/latest/developer-reference/#functions'
                if (loc.table === 'dj-database')
                    href = 'https://dashjoin.github.io/platform/latest/user-interface/#data-and-database-management'
                if (loc.table === 'dj-role')
                    href = 'https://dashjoin.github.io/platform/latest/security/#access-control'
                if (loc.search)
                    href = 'https://dashjoin.github.io/platform/latest/user-interface/#search-page'
            }
            window.open(href, '_blank')
        }
    }
    const back = {
        text: 'Back', action: () => {
            const current = tour.steps.indexOf(tour.getCurrentStep()!)
            const nav = tour.steps[current - 1]?.id
            if (nav?.startsWith('/')) {
                tour.hide()
                navigate(nav)
                setTimeout(() => tour.back(), 200)
            } else
                tour.back()
        }
    }
    const next = {
        text: 'Next', action: () => {
            const current = tour.steps.indexOf(tour.getCurrentStep()!)
            const nav = tour.steps[current + 1]?.id
            if (nav?.startsWith('/')) {
                tour.hide()
                navigate(nav)
                setTimeout(() => tour.next(), 200)
            } else
                tour.next()
        }
    }

    if (edit) {
        tour.addStep({
            text: 'View the layout editor documentation by clicking the docs button.',
            buttons: [{
                text: 'Docs', action: () => {
                    window.open('https://dashjoin.github.io/platform/latest/user-interface/#layout-editor', '_blank')
                    tour.next()
                }
            }]
        })
    } else {
        tour.addStep({
            text: 'Welcome to the Dashjoin tutorial. In this tutorial, we will write a customer management application including dashboards and an AI that formulates emails to customers. You can always return to the tutorial by pressing this icon.',
            attachTo: { element: '#help_outline', on: 'bottom' },
            buttons: [help, next]
        })

        tour.addStep({
            text: "Dashjoin can connect to any number of databases.",
            attachTo: { element: '#settings', on: 'bottom' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/config/dj-database',
            text: 'If you do not yet have a DB connected, you can do so using this form. Choose type=SQLDatabase, name=postgres, and url=jdbc:sqlite:sqlite.db. Alternatively, you can press the create database button.',
            attachTo: { element: '.create-page', on: 'bottom' },
            buttons: [back, help,
                {
                    text: 'Create database',
                    action: async () => {
                        try {
                            notify('Working...')
                            if (await dataProvider.expression('$djVersion().title') === 'dashjoin-playground') {
                                notify('In the playground, you have a pre-configured database already')
                                return
                            }
                            await dataProvider.create('config/dj-database', { data: { id: 'dj/postgres', name: 'postgres', djClassName: 'org.dashjoin.service.SQLDatabase', url: 'jdbc:sqlite:sqlite.db' } })
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                },
                {
                    text: 'Next',
                    action: async () => {
                        try {
                            await api.read('config', 'dj-database', 'dj/postgres')
                            next.action()
                        }
                        catch (err) {
                            notify('Cannot find database "postgres"')
                        }
                    }
                },
            ]
        })

        tour.addStep({
            id: '/config/dj-database/dj%2Fpostgres',
            text: 'You can expand this panel and upload data from this URL: https://download.dashjoin.com/demo/upload/Customers.json. Alternatively, you can press the upload data button.',
            attachTo: { element: '.MuiAccordion-gutters', on: 'top' },
            buttons: [back, help,
                {
                    text: 'Upload data',
                    action: async () => {
                        try {
                            notify('Working...')
                            const base64 = await dataProvider.expression('$openText("https://download.dashjoin.com/demo/upload/Customers.json", "BASE_64")')
                            const f = await fetch('data:;base64,' + base64)
                            const blob = await f.blob()
                            const file = new File([blob], 'Customers.json')
                            if (file.size > 10 * 1024 * 1024) {
                                notify('Uploads are limited to 10MB', { type: 'warning' });
                                return;
                            }
                            const formData = new FormData();
                            const path = (file as any).webkitRelativePath ?
                                (file as any).webkitRelativePath : file.name;
                            formData.append('file', file, encodeURIComponent(path));
                            const dr = await dataProvider.upload('detect', 'postgres', formData)
                            if (!dr.createMode) {
                                notify('Table Customers is already present')
                                return
                            }
                            formData!.append('__dj_schema', JSON.stringify(dr.schema));
                            await dataProvider.upload('create', 'postgres', formData)
                            api.clearCache()
                            render.setDdl()
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                },
                {
                    text: 'Next',
                    action: async () => {
                        try {
                            await api.read('config', 'Table', 'dj/postgres/Customers')
                            next.action()
                        }
                        catch (err) {
                            notify('Cannot find table "Customers"')
                        }
                    }
                },
            ]
        })

        tour.addStep({
            id: '/postgres/Customers',
            text: "This page visualizes the table. You can use the form below to create a new record. Let's look at one of the customers.",
            attachTo: { element: '.RaList-main', on: 'bottom' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/postgres/Customers/ALFKI',
            text: 'This page visualizes a customer record. Click here to change the page and add the AIChat widget to the page. You need to configure the parameters listed below. Alternatively, press the add chat widget button. If you enter a prompt like "did you get your order?", the AI will formulate an email to this customer.<br><br>' +
                'llmservice = llmchat (leave blank if you are on premise)<br><br>' +
                'additional config settings = {"promptConfig": {"system_prompt": "You are Joe, an inside sales specialist with ACME. Your email is joe@acme.org. Your phone number is 1-345-334-5523. You communicate with the customer: " & $string(value) & ". Using the chat request, write an email to the customer." }}',
            attachTo: { element: '#edit', on: 'bottom' },
            buttons: [back, help,
                {
                    text: 'Add chat widget',
                    action: async () => {
                        notify('Working...')
                        try {
                            const url = await dataProvider.expression('$djVersion().title') === 'dashjoin-playground' ? 'llmchat' : undefined
                            await dataProvider.update('config/Table', {
                                id: 'dj/postgres/Customers', data: {
                                    id: 'dj/postgres/Customers',
                                    ID: 'dj/postgres/Customers',
                                    instanceLayout: {
                                        "widget": "page",
                                        "children": [
                                            { widget: 'edit' },
                                            {
                                                "widget": "aichat",
                                                url,
                                                "extraArgs": "{\"promptConfig\": {\"system_prompt\": \"You are Joe, an inside sales specialist with ACME. Your email is joe@acme.org. Your phone number is 1-345-334-5523. You communicate with the customer: \" & $string(value) & \". Using the chat request, write an email to the customer.\" }}",
                                            },
                                        ]
                                    }
                                }, previousData: {}
                            })
                            refresh()
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                }
                , next]
        })

        tour.addStep({
            text: "Now we'll create a query. This icon brings you to the query catalog.",
            attachTo: { element: '#query_builder', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/config/dj-query-catalog',
            text: 'Use this form to create a new query called "CustomerPerCountry" that selects the customers grouped by country. Alternatively, press the create query button.',
            attachTo: { element: '.RaCreate-main', on: 'top' },
            buttons: [back, help,
                {
                    text: 'Create query',
                    action: async () => {
                        try {
                            notify('Working...')
                            await dataProvider.create('config/dj-query-catalog', {
                                data: {
                                    ID: 'CustomerPerCountry',
                                    query: 'SELECT "Customers"."COUNTRY", COUNT("Customers"."CUSTOMER_ID") FROM "Customers" GROUP BY "Customers"."COUNTRY"',
                                    "type": "read",
                                    "database": "dj/postgres",
                                }
                            })
                            refresh()
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                },
                {
                    text: 'Next',
                    action: async () => {
                        try {
                            await api.read('config', 'dj-query-catalog', 'CustomerPerCountry')
                            next.action()
                        }
                        catch (err) {
                            notify('Cannot find query "CustomerPerCountry"')
                        }
                    }
                },
            ]
        })

        tour.addStep({
            text: "Now we'll create a dashboard page. This icon brings you to the dashboard page overview.",
            attachTo: { element: '#wysiwyg', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/config/page',
            text: 'Use this form to create a new page called "Dashboard". Alternatively, press the create page button.',
            attachTo: { element: '.RaCreate-main', on: 'top' },
            buttons: [back, help,
                {
                    text: 'Create page',
                    action: async () => {
                        try {
                            notify('Working...')
                            await dataProvider.create('config/page', { data: { ID: 'Dashboard' } })
                            refresh()
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                },
                {
                    text: 'Next',
                    action: async () => {
                        try {
                            await api.read('config', 'page', 'Dashboard')
                            next.action()
                        }
                        catch (err) {
                            notify('Cannot find page "Dashboard"')
                        }
                    }
                },
            ]
        })

        tour.addStep({
            id: '/page/Dashboard',
            text: 'Click here to edit the page and add a chart widget to the page. You need to configure the parameters listed below. Alternatively, press the add chart widget button.<br><br>' +
                'database = postgres<br>' +
                'query = CustomerPerCountry<br>' +
                'chart = bar',
            attachTo: { element: '#edit', on: 'bottom' },
            buttons: [back, help,
                {
                    text: 'Add chart widget',
                    action: async () => {
                        try {
                            notify('Working...')
                            await dataProvider.update('config/page', {
                                id: 'Dashboard', data: {
                                    id: 'Dashboard',
                                    ID: 'Dashboard',
                                    "layout": {
                                        "widget": "page",
                                        "children": [
                                            {
                                                "database": "postgres",
                                                "query": "CustomerPerCountry",
                                                "chart": "bar",
                                                "widget": "chart"
                                            }
                                        ]
                                    }
                                }, previousData: {}
                            })
                            refresh()
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                }
                , next]
        })

        tour.addStep({
            text: "Now we'll explore functions. This icon brings you to the function overview.",
            attachTo: { element: '#build_circle', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/config/dj-function',
            text: "Functions are used to load data into a database (ETL), configure Email servers, or other REST services. If you are in the online playground, you find our pre-configured AI REST service here.",
            attachTo: { element: '.RaList-main', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            text: "Now we'll explore the JSONata Notebook. This icon brings you to the info overview.",
            attachTo: { element: '#info', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/page/Info',
            text: "On this info page, select the Notebook.",
            attachTo: {
                element: () => {
                    const els = document.getElementsByTagName('span')
                    for (let i = 0; i < els.length; i++)
                        if (els.item(i)?.innerHTML === 'edit_note')
                            return els.item(i)?.parentNode?.parentNode as any
                }, on: 'top'
            },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/page/Notebook',
            text: 'On the JSONata Notebook, you can test JSONata functions. Try the following function:<br><br>$read("postgres", "Customers", "ALFKI")',
            attachTo: { element: '#info', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            text: "Next, we'll explore how you can install apps into your playground. Click on Info again and then select the Git icon.",
            attachTo: { element: '#info', on: 'top' },
            buttons: [back, help, next]
        })

        tour.addStep({
            id: '/page/App',
            text: 'From the Install Apps from GitHub section, select an app and press install.',
            buttons: [back, help, { text: 'Done', action: tour.next }]
        })
    }

    useEffect(() => {
        if (!localStorage.getItem('dj-tour-opened')) {
            tour.start()
            localStorage.setItem('dj-tour-opened', 'true')
        }
    }, [])

    return <Tooltip title={widget.tooltip}>
        <IconButton id={widget.icon} color="inherit" onClick={() => {
            if (profile.isInRoles(false, ['admin'])) {
                if (tour.isActive())
                    return
                tour.start()
                tour.show(location.pathname)
            } else
                help.action()
        }}>
            <Icon>
                {widget.icon}
            </Icon>
        </IconButton>
    </Tooltip>
}