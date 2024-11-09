import { Link } from "react-router-dom";
import { util } from "../api/Util";
import { LinkValue } from "./LinkValue";
import React from "react";
import { DateField } from "react-admin";
import { Card, CardHeader, CardActions, CardContent } from '@mui/material';
import { Value } from "./Value";

/**
 * helper to share code between Value and MyListGuesser regarding
 * how to handle url / img objects
 */
export const helper = (data: any) => {
    if (!data)
        return undefined

    // {href, label?}
    if (Object.keys(data).length === 1 && data.href)
        return <Link to={util.href(data.href)}>{util.href(data.href)}</Link>;
    if (Object.keys(data).length === 2 && data.href && data.label && (typeof data.label === 'string' || typeof data.label === 'number'))
        return <Link to={util.href(data.href)}>{data.label}</Link>;

    // {cardheader, cardcontent, width?, height?}
    if (data.cardheader && data.cardcontent) {
        const card = <Card sx={{ width: data.width, height: data.height }}>
            <CardHeader subheader={data.cardheader}></CardHeader>
            <CardContent>
                <Value data={data.cardcontent}></Value>
            </CardContent>
        </Card>
        if (Object.keys(data).length === 2)
            return card
        if (Object.keys(data).length === 3 && data.width)
            return card
        if (Object.keys(data).length === 3 && data.height)
            return card
        if (Object.keys(data).length === 4 && data.width && data.height)
            return card
    }

    // {date}
    if (data.date)
        if (Object.keys(data).length === 1)
            return <DateField source="date" record={data} />

    // {datetime}
    if (data.datetime)
        if (Object.keys(data).length === 1)
            return <DateField source="datetime" record={data} showTime={true} />

    // {img, width?, height?}
    if (data.img) {
        if (Object.keys(data).length === 1)
            // eslint-disable-next-line @next/next/no-img-element
            return <img alt="" src={data.img}></img>
        if (Object.keys(data).length === 2 && data.width)
            // eslint-disable-next-line @next/next/no-img-element
            return <img alt="" src={data.img} width={data.width}></img>
        if (Object.keys(data).length === 2 && data.height)
            // eslint-disable-next-line @next/next/no-img-element
            return <img alt="" src={data.img} height={data.height}></img>
        if (Object.keys(data).length === 3 && data.width && data.height)
            // eslint-disable-next-line @next/next/no-img-element
            return <img alt="" src={data.img} width={data.width} height={data.height}></img>
    }

    // {database, table, pk1, page?}
    if (Object.keys(data).length === 4)
        if (data.database && data.table && util.isValue(data.pk1) && data.page)
            return <LinkValue pagePar={data.page} data={data.pk1} prop={{ database: data.database, table: data.table }} />
    if (Object.keys(data).length === 3)
        if (data.database && data.table && util.isValue(data.pk1))
            return <LinkValue data={data.pk1} prop={{ database: data.database, table: data.table }} />

    if (data && Object.keys(data).length === 3)
        if (data.database && data.table && Array.isArray(data.pk))
            // TODO: we do not resolve dj-label here
            // cannot use <LinkValue> because we're in the const data provider context
            // <ReferenceField> does not work because we'd need to change {db, table, pk} to pk
            return <Resource data={data} />

    let counter = 0
    if (data && Object.keys(data).length === 2)
        if (data.start && data.steps)
            return <>
                <Resource data={data.start._dj_resource} />
                {data.steps.map((s: any) => {
                    return s.edge._dj_outbound ?
                        <React.Fragment key={counter++}><span> -{s.edge._dj_edge}-&gt; </span><Resource data={s.end._dj_resource}></Resource></React.Fragment> :
                        <React.Fragment key={counter++}><span> &lt;-{s.edge._dj_edge}- </span><Resource data={s.end._dj_resource}></Resource></React.Fragment>
                })}
            </>

    return undefined
}

const Resource = ({ data }: { data: any }) => {
    if (Array.isArray(data.pk))
        if (data.pk.length !== 1)
            return <Link to={'/' + data.database + '/' + encodeURIComponent(data.table) + '/' + encodeURIComponent(data.pk.join('_'))}>{data.pk.join('_')}</Link>
    return <LinkValue data={data.pk[0]} prop={data}></LinkValue >
}
