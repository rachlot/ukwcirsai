import { CreateParams, CreateResult, DataProvider, DeleteManyParams, DeleteManyResult, DeleteParams, DeleteResult, GetListParams, GetListResult, GetManyParams, GetManyReferenceParams, GetManyReferenceResult, GetManyResult, GetOneParams, GetOneResult, RaRecord, UpdateManyParams, UpdateManyResult, UpdateParams, UpdateResult } from "ra-core";
import { Row } from "../model/row";
import { dataProvider } from "./DjDataProvider";
import { util } from "./Util";

/**
 * react admin data provider that can feed a static table via the interface
 */
export class ConstDataProvider {

    /**
     * creates a new instance with the provided data
     */
    create(json: Row[]): DataProvider {

        let i = 0
        // TODO: there might be an id field in the result
        for (const row of json) {
            row.id = i++
        }

        return {

            getList: async function <RecordType extends RaRecord = any>(resource: string, params: GetListParams): Promise<GetListResult<RecordType>> {

                util.samples[resource] = json

                // sorting
                let res = json.slice()
                res.sort((a: any, b: any) => {
                    let aa = a?.[params.sort.field];
                    let bb = b?.[params.sort.field];
                    if (aa === undefined || aa === null)
                        aa = '';
                    if (bb === undefined || bb === null)
                        bb = '';

                    // sorting for value objects
                    aa = util.normalizeValue(aa)
                    bb = util.normalizeValue(bb)

                    return (aa === bb ? 0 : (aa < bb ? -1 : 1)) * (params.sort.order === 'ASC' ? 1 : -1);
                });

                if (params.filter)
                    Object.entries(params.filter).forEach(([k, v]) => {
                        if (typeof v === 'string') {
                            if (v.startsWith('> ')) {
                                res = res.filter(row => row[k] > v.substring(2))
                                return
                            }
                            if (v.startsWith('>= ')) {
                                res = res.filter(row => row[k] >= v.substring(3))
                                return
                            }
                            if (v.startsWith('< ')) {
                                res = res.filter(row => row[k] < v.substring(2))
                                return
                            }
                            if (v.startsWith('<= ')) {
                                res = res.filter(row => row[k] <= v.substring(3))
                                return
                            }
                            if (v.startsWith('<> ') || v.startsWith('!= ')) {
                                res = res.filter(row => row[k] !== v.substring(3))
                                return
                            }
                        }
                        res = res.filter(row => row[k] === v)
                    })

                const from = (params.pagination.page - 1) * params.pagination.perPage
                const to = params.pagination.page * params.pagination.perPage
                return {
                    data: res.slice(from, to) as any,
                    total: res.length
                };
            },
            getOne: async function <RecordType extends RaRecord = any>(resource: string, params: GetOneParams<any>): Promise<GetOneResult<RecordType>> {
                if (resource === 'config/Table')
                    throw new Error('Const provider has no access to config DB')
                return {
                    data: json[params.id] as any
                }
            },
            getMany: function <RecordType extends RaRecord = any>(resource: string, params: GetManyParams): Promise<GetManyResult<RecordType>> {
                // getMany is called when the query result contains pks or fks
                // in order to look up the label data
                // delegate to the DjDataProvider
                return dataProvider.getMany(resource, params).catch(() => {
                    // we might get an error if one of the result records has been deleted in the meantime
                    return Promise.resolve({
                        data: params.ids.map(id => { return { id } as any })
                    })
                })
            },
            getManyReference: function <RecordType extends RaRecord = any>(resource: string, params: GetManyReferenceParams): Promise<GetManyReferenceResult<RecordType>> {
                throw new Error("Function not implemented.");
            },
            update: function <RecordType extends RaRecord = any>(resource: string, params: UpdateParams<any>): Promise<UpdateResult<RecordType>> {
                throw new Error("Function not implemented.");
            },
            updateMany: function <RecordType extends RaRecord = any>(resource: string, params: UpdateManyParams<any>): Promise<UpdateManyResult<RecordType>> {
                throw new Error("Function not implemented.");
            },
            create: function <RecordType extends RaRecord = any>(resource: string, params: CreateParams<any>): Promise<CreateResult<RecordType>> {
                throw new Error("Function not implemented.");
            },
            delete: function <RecordType extends RaRecord = any>(resource: string, params: DeleteParams<RecordType>): Promise<DeleteResult<RecordType>> {
                throw new Error("Function not implemented.");
            },
            deleteMany: function <RecordType extends RaRecord = any>(resource: string, params: DeleteManyParams<RecordType>): Promise<DeleteManyResult<RecordType>> {
                throw new Error("Function not implemented.");
            }
        }
    }
}

export const constDataProvider = new ConstDataProvider()
