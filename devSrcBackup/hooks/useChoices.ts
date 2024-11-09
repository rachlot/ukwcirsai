import jsonata from "jsonata";
import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";
import { Choice } from "../model/choice";
import { Schema } from "../model/schema";
import { useExpressionContext } from "./useExpressionContext";

/**
 * computes the choices
 */
export const useChoices = (schema: Schema) => {

    const dataProvider = useDataProvider()
    const context = useExpressionContext()

    const choices = async (): Promise<Choice[] | undefined> => {
        let c: any

        // choices in the schema
        if (schema.choices)
            if (schema.displayWithChoices) {
                let i = 0
                c = []
                for (const choice of schema.choices)
                    c.push({ name: schema.displayWithChoices[i++], value: choice })
            } else
                c = schema.choices

        // enum
        if (schema.enum)
            c = schema.enum

        // http get or post
        if (schema.choicesUrl) {
            if (schema.choicesVerb === 'GET')
                c = await dataProvider.get(schema.choicesUrl)
            else
                c = await dataProvider.postCached(schema.choicesUrl, {})
        }

        // jsonata transform
        if (schema.jsonata) {
            c = await jsonata(schema.jsonata!).evaluate(c)

            // jsonata skips array for single item arrays
            if (c && !Array.isArray(c))
                c = [c]
        }

        if (schema.options) {
            c = await dataProvider.expression(schema.options, context)

            // jsonata skips array for single item arrays
            if (c && !Array.isArray(c))
                c = [c]
        }

        // apply URL localName if specified 
        if (schema.displayWith === 'localName' && c) {
            c = c.map((value: any) => {
                for (const delimiter of ['/', '#', ':', '.']) {
                    const parts = value.split(delimiter);
                    if (parts.length > 1) {
                        if (parts[parts.length - 1] === '') {
                            return { value, name: parts[parts.length - 2] }
                        } else {
                            return { value, name: parts[parts.length - 1] }
                        }
                    }
                }
                return { value, name: value }
            })
        }

        if (c) {

            // if choice is a single value, default to name = value
            c = c.map((value: any) => {
                if (typeof value !== 'object')
                    return { value, name: value }
                else
                    return value
            })
            return c
        }
    }

    return useQuery(
        ['choice', schema],
        async () => {
            const c = await choices()
            const res = []
            if (c)
                for (const i of c)
                    res.push({ id: i.value, name: i.name })
            return res
        }
    );
}
