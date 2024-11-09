//import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Icon } from "@mui/material";
import { title } from "../api/Const";
import Expression from "../uniforms/Expression";
import "@fortune-sheet/react/dist/index.css";
import React, { useEffect, useRef, useState } from "react";
import { useExpression } from "../hooks/useExpression";
import { Loading } from 'react-admin';
import { PrintError } from '../components/PrintError';
import dynamic from "next/dynamic";
//import LuckyExcel from 'luckyexcel';
import "luckysheet/dist/css/luckysheet.css"
import "luckysheet/dist/plugins/plugins.css"
import "luckysheet/dist/plugins/css/pluginsCss.css"
import "luckysheet/dist/assets/iconfont/iconfont.css"
import { api } from "../api/Api";
import Head from "next/head";

// Workaround: export $ in window
/*
import $ from 'jquery';
(window as any).jQuery = $;
(window as any).$ = $;
import {v4} from 'uuid';
(window as any).uuid = { v4 };
*/

// Dynamically load fortune-sheet. Saves ~3MB on initial load
const Workbook = dynamic( () => import('@fortune-sheet/react').then((mod) => mod.Workbook) );

const LuckyExcel = (await import('luckyexcel')).default;

//const luckysheet = (await import('luckysheet')).default;
//import luckysheet from 'luckysheet';


/**
 * Converts data to fortuneSheet format
 * 
 * @param data Data retrieved in format of $openExcel
 * @returns 
 */
const importFromOpenExcel = (data:any) => {
    let res = [];
    for (const key of Object.keys(data)) {
        const sheet = data[key];
        let cells = [];
        let r = 0;
        for (const row of sheet) {

            let c = 0;
            for (const col of row) {
                if (col && col!=="") {
                    if (typeof(col)==="number") {
                        // Number needs type settings:
                        cells.push( { r, c, v:{
                            v:col, m:""+col,
                            ct:{fa:"General",t:"n"}
                        }});
                    } else {
                        cells.push({ r, c, v:col });
                    }
                }
                c++;
            }

            r++;
        }
        let sheetdata = { name:key, celldata:cells };
        res.push(sheetdata);
    }
    return res;
}

const Spreadsheet1 = ({ widget }: { widget: any }) => {

    // DOM reference. Fixes multiple widgets per page + caching issues
    const ref = useRef(null);

    // Parse config, ignore errors
    let { data, isLoading, error } = useExpression(widget.cached!, widget.extraArgs)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // If format is not an array of sheets, convert:
    //console.log("type", Array.isArray(data), data)
    if (data && !Array.isArray(data))
        data = importFromOpenExcel(data);

    return <div style={{width:"100%", height:"500px"}}>
            <Workbook data={data || [{ name: "Sheet1" }] } />
        </div>
}

export const Spreadsheet = ({ widget }: { widget: any }) => {

    // DOM reference. Fixes multiple widgets per page + caching issues
    const ref = useRef(null);

    // Parse config, ignore errors
    let { data, isLoading, error } = useExpression(widget.cached!, widget.extraArgs)

    const url = widget.url;

    const [excel, setExcel] = useState([{ name: "Sheet1" }]);

    useEffect(()=> {

    if (url) {
        //console.log("LuckyExcel", url, LuckyExcel)
        LuckyExcel.transformExcelToLuckyByUrl(url, url, (exportJson:any, luckysheetfile:string) => {
            console.log("imported excel", exportJson);//, luckysheetfile);
            setExcel(exportJson.sheets);
        });
    }
});

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // If format is not an array of sheets, convert:
    //console.log("type", Array.isArray(data), data)
    if (data && !Array.isArray(data)) {
        data = importFromOpenExcel(data);
    }

    return <div style={{width:"100%", height:"500px"}}>
            <Workbook data={data || excel } />
        </div>
}



const Luckysheet0 = () => {
  const [luckysheetLoaded, setLuckysheetLoaded] = useState(false);

  const luckyCss = {
    margin: '0px',
    padding: '0px',
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: '0px',
    top: '0px',
  };

  const loadLuckysheet = async () => {
    try {
      // Load Luckysheet dynamically
      const luckysheetModule = await import('luckysheet');
      const luckysheet = luckysheetModule.default;

      // Initialize Luckysheet
      luckysheet.create({
        container: 'luckysheet',
      });

      // Set the loaded state
      setLuckysheetLoaded(true);
    } catch (error) {
      console.error('Error loading Luckysheet:', error);
    }
  };

  useEffect(() => { loadLuckysheet() }, []);

  return (
    <div id="luckysheet" style={luckyCss as any}></div>
  );
};

function loadScript(src: string) {
  return new Promise<any>(resolve => {
      const script = document.createElement("script");
      script.async = true;
      script.onload = resolve;
      script.src = src;
      document.head.appendChild(script);
  });
}

const Luckysheet = ({ widget }: { widget: any }) =>  {
  
  const excelLoaded = useRef(null);
  
   const luckyCss = {
     margin: '0px',
     padding: '0px',
     //position: 'absolute',
     width: '100%',
     height: '600px',
     left: '0px',
     top: '0px',
   };
   
   const excelUrl:any = useExpression(widget.cached!, widget.url);

   const extraArgs:any = useExpression(widget.cached!, widget.extraArgs)

   console.log("url", JSON.stringify(excelUrl), "data", extraArgs)

   useEffect(() => {

    async function initSheet() {
      const url = excelUrl.data;
      const data = extraArgs.data;
      if ((url && url!==excelLoaded.current) || data ) {
        excelLoaded.current = url;

        const scripts = ["assets/plugin.js", //assets/luckysheet/plugins/js/plugin.js",
        "assets/luckysheet.umd.js", //"assets/luckysheet/luckysheet.umd.js",
        //"assets/echarts.min.js",
        //"assets/luckysheet/expendPlugins/chart/chartmix.umd.min.js",
      ];

      await Promise.all(scripts.map(loadScript));
      //console.log('luckysheet loaded', excelUrl);
      const luckysheet = (window as any).luckysheet;
  
      if (url) {
        let json:any = {};
        const excel = await api.axios.get(url, {responseType:"arraybuffer"});
        json = await new Promise(resolve => LuckyExcel.transformExcelToLucky(excel.data, resolve));
        console.log("Excel imported", json);

        luckysheet.destroy();
        luckysheet.create({
          container: 'luckysheetDiv',
          showinfobar: false,

          // Read-only settings:
          allowEdit: false,
          showtoolbar: false,
          allowCopy: false,
          showsheetbar: json?.sheets?.length>1,
          showstatisticBar: false,
          sheetFormulaBar: false,
          forceCalculation: false,
          NOplugins: [{
              name: 'chart'
          }, {
              name: 'print'
          }],

          // Data
          data: json?.sheets,
          title: json?.info?.name,
          userInfo: json?.info?.name?.creator
        });
      } else {
        luckysheet.destroy();

        let celldata:any = [];
        let sheet = undefined;
        try {
          const addHeader = true;
          // Copy all attributes of each received obj as value
          let r = 0;
          sheet = extraArgs?.data?.sheet;
          const col = extraArgs?.data?.column || 0;
          const row = extraArgs?.data?.row || 0;
          for (const obj of extraArgs?.data?.data) {
            let c = 0;

            if (addHeader && r===0) {
              for (const key of Object.keys(obj)) {
                const v = key;
                celldata.push({r:r+row,c:c+col,v});
                //luckysheet.setCellValue(r, c, val);
                c++;
              }
              c = 0; r++;
            }

            for (const key of Object.keys(obj)) {
              const v = obj[key];
              celldata.push({r:r+row,c:c+col,v});
              //luckysheet.setCellValue(r, c, val);
              c++;
            }
            r++;
          }
        }
        catch (e) {
          console.warn();
        }

        
        luckysheet.create({
          container: 'luckysheetDiv',
          showinfobar:false,
          data:sheet && sheet!=="Data" ? [
            {
              name: "Data"
            },
            {
              name: sheet, celldata
            }
          ] :
          [
						{
              name:"Data", celldata
						}
					]
        });

    }
    }
  }
  
    initSheet();

  }, [excelUrl, extraArgs]);
   
   return (
    <div id="luckysheetDiv" style={luckyCss}>
    </div>
   )
 }
 
/*

      <Head>
        <script async src="assets/luckysheet/css/luckysheet.css"></script>
        <script async src="assets/luckysheet/plugins/plugins.css"></script>
        <script async src="assets/luckysheet/plugins/css/pluginsCss.css"></script>
        <script async src="assets/luckysheet/assets/iconfont/iconfont.css"></script>
     </Head>
*/


export default Luckysheet;


//export default Spreadsheet;

export const config = {
    id: 'spreadsheet',
    title: 'Spreadsheet',
    description: 'Calculation Spreadsheet',
    version: 1,
    icon: <Icon>table</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                url: { title:"URL of Excel", type:"string" },
                extraArgs: { title: 'Data', uniforms: { component: Expression } },
            }
        }
    }
}