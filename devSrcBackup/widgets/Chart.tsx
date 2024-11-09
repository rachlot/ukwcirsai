import { Chart as ChartJS, ChartData, ChartOptions, registerables } from 'chart.js'
import 'chartjs-adapter-moment'
import { Loading } from 'ra-ui-materialui'
import { useRef } from "react"
import { Bar, Doughnut, getElementAtEvent, Line, PolarArea, Radar } from 'react-chartjs-2'
import { useNavigate } from 'react-router-dom'
import { util } from '../api/Util'
import { useDjQuery } from '../hooks/useDjQuery'
import { useExpression } from '../hooks/useExpression'
import { Schema } from '../model/schema'
import { Widget } from '../model/widget'
import { _arguments, card, chart, database, expression, graph, query, style, title } from '../api/Const'
import { Box, Icon } from '@mui/material'
import { PrintError } from "../components/PrintError";

/**
 * register required chart js modules
 */
ChartJS.register(...registerables);

/**
 * chart that displays data with the help of metadata
 */
export default function Chart({ widget }: { widget: Widget }) {
    if (widget.expression)
        return <ExpressionChart widget={widget}></ExpressionChart>
    else if (widget.arguments)
        return <QueryChartArgs widget={widget}></QueryChartArgs>
    else if (widget.query) {
        if (widget.database)
            return <QueryChart widget={widget}></QueryChart>
        else
            return <p>Chart - please provide a database to run the query on</p>
    } else
        return <p>Chart - please provide a query or expression</p>
}

function QueryChartArgs({ widget }: { widget: Widget }) {
    const { data, isLoading, error } = useExpression(widget.cached!, widget.arguments)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <QueryChart widget={widget} args={data}></QueryChart>
}

function QueryChart({ widget, args }: { widget: Widget, args?: any }) {
    const { data: tmp, isLoading, error } = useDjQuery(widget, args)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    if (!tmp) return <PrintError error={error}></PrintError>
    const sd = tmp as { data: any, schema: Schema }
    return <DrawChart widget={widget} data={sd.data} schema={sd.schema}></DrawChart>
}

function ExpressionChart({ widget }: { widget: Widget }) {
    const { data, isLoading, error } = useExpression(widget.cached!, widget.expression)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    return <DrawChart widget={widget} data={data} schema={util.inferSchemaFromData(data)}></DrawChart>
}

export function DrawChart({ widget, data, schema }: { widget: Widget, data: any, schema: Schema }) {

    const navigate = useNavigate();
    const chartRef = useRef();

    // chart data
    let chartdata: ChartData<'bar'>

    /**
     * parses style key/value to config object
     */
    const options = (): any /*ChartOptions*/ => {
        const res: any = {
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                },
            }
        };
        if (!widget.style)
            return res
        for (let [key, value] of Object.entries(widget.style)) {
            let ctx: any = res;
            const arr = key.split('.');
            const last = arr.pop();
            if (!last)
                continue
            for (const k of arr) {
                if (!ctx[k]) ctx[k] = {};
                ctx = ctx[k];
            }
            let myval: any = value
            if (value === 'true')
                myval = true;
            if (value === 'false')
                myval = false;
            if (!isNaN(Number(value)))
                myval = Number(value);
            ctx[last] = myval;
        }

        if (widget.style?.width && widget.style?.height)
            res.maintainAspectRatio = false

        return res
    }

    /**
     * called by click handler - checks the series / label columns for PKs FKs
     */
    const go = (id: any, propIndex: number) => {
        if (id) {
            const prop = Object.values(schema.properties!)[propIndex]
            if (prop.ref)
                navigate('/' + util.parseColumnID(prop.ref).database + '/' + util.parseColumnID(prop.ref).table + '/' + id)
            if (util.isValue(prop.pkpos))
                navigate('/' + util.parseColumnID(prop.ID!).database + '/' + util.parseColumnID(prop.ID!).table + '/' + id)
        }

    }

    /**
     * click handler
     */
    const onClick = ((event: any) => {
        const arr = getElementAtEvent(chartRef.current as any, event)
        if (arr.length > 0) {
            const index = arr[0].index
            const datasetIndex = arr[0].datasetIndex

            if (Object.keys(schema.properties!).length === 2)
                go(chartdata?.labels?.[index], 0)
            if (Object.keys(schema.properties!).length === 3) {
                go(chartdata?.labels?.[index], 1)
                go(chartdata?.datasets[datasetIndex].label, 0)
            }
        }
    })

    if (Object.keys(schema.properties!).length === 2 && data.length > 0) {
        /**
         * we assume the following result structure
         * 
         *         | series
         * -----------------
         * label 1 | value 1
         * label 2 | value 2
         */
        const labelCol = Object.keys(schema.properties!)[0]
        const valueCol = Object.keys(schema.properties!)[1]
        chartdata = {
            // col 0 are the labels
            labels: data.map((row: any) => row[labelCol]),
            datasets: [
                {
                    // col 1 keyname is the dataset label
                    label: valueCol,
                    // col 1 are the values
                    data: data.map((row: any) => row[valueCol]),
                }
            ],
        }
    }
    else if (Object.keys(schema.properties!).length === 3 && data.length > 0) {
        /**
         * we assume the following result structure
         * 
         *          |         | series
         * ----------------------------
         * series 1 | label 1 | value 1
         * series 2 | label 2 | value 2
         */
        const seriesCol = Object.keys(schema.properties!)[0]
        const labelCol = Object.keys(schema.properties!)[1]
        const valueCol = Object.keys(schema.properties!)[2]

        // keep track of all labels as they might be spread over multiple rows
        const lables = util.distinct(data, labelCol)

        // group by series and then by labels
        const datasets = util.groupBy(data, seriesCol)
        for (const k of Object.keys(datasets))
            datasets[k] = util.groupBy(datasets[k], labelCol)

        chartdata = {
            labels: lables,
            datasets: Object.keys(datasets).map(ds => {
                return {
                    label: ds,
                    // make sure data array has the same length as labels
                    // lookup dataset -> label
                    // this yields undefined or [ { valueCol: value } ]
                    data: lables.map(label => datasets[ds][label]?.[0][valueCol])
                }
            })
        }
    } else {
        console.log(data)
        return <p>No data available</p>
    }

    let chart
    if (widget.chart === 'bar')
        chart = <Bar data={chartdata} options={options()} onClick={onClick} ref={chartRef} />
    else if (widget.chart === 'doughnut')
        chart = <Doughnut data={chartdata as any} options={options() as any} onClick={onClick} ref={chartRef} />
    else if (widget.chart === 'polarArea')
        chart = <PolarArea data={chartdata as any} options={options() as any} onClick={onClick} ref={chartRef} />
    else if (widget.chart === 'radar')
        chart = <Radar data={chartdata as any} options={options() as any} onClick={onClick} ref={chartRef} />
    else if (widget.chart === 'line')
        chart = <Line data={chartdata as any} options={options()} onClick={onClick} ref={chartRef} />
    else
        chart = <p>Unknown chart type: {widget.chart}</p>
    return <Box sx={{ width: widget.style?.width, height: widget.style?.height }}>{chart}</Box>
}

export const config = {
    id: 'chart',
    title: 'Chart',
    description: 'Display a chart based on query or expression results',
    version: 1,
    icon: <Icon>insert_chart</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                card: card,
                database: database,
                query: query,
                graph: graph,
                chart: chart,
                expression: expression,
                arguments: _arguments,
                style: style
            }
        }
    }
}