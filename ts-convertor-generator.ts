#!/usr/bin/env -S deno run -A --ext ts
import { argv, echo } from "npm:zx@7.1.1";
// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.0/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";
import { Eta } from "https://deno.land/x/eta@v3.0.3/src/index.ts";

// types
export type TargetRow = {
  from_property: string;
  from_data_type: string;
  to_property: string;
  to_data_type: string;
  method: string | null;
};

export type MethodRow = {
  from_data_type: string;
  to_data_type: string;
  method: string;
};

const TEMPLATE = `
export type From = { 
  <% it.rows.forEach((row) => { %>
    <%= row.from_property %>: <%= row.from_data_type %>;
  <% }) %> 
};

export type To = { 
  <% it.rows.forEach((row) => { %>
    <%= row.to_property %>: <%= row.to_data_type %>;
  <% }) %>
};

export const convertor = (from: From): To => {
  return ({ 
  <% it.rows.forEach((row) => { %>
    <%= row.to_property %>: <%= row.method %>,
  <% }) %>
  })
};
` as const;

const fileExists = (filepath: string): boolean => {
  try {
    const file = Deno.statSync(filepath);
    return file.isFile;
  } catch (_e) {
    return false;
  }
};

const dirExists = (dirpath: string): boolean => {
  try {
    const file = Deno.statSync(dirpath);
    return file.isDirectory;
  } catch (_e) {
    return false;
  }
};

const TARGET = "target" as const;
const DEFAULT_OUTDIR = "./out" as const;
const HELP = `
ts-convertor-generator from excel

Usage: ts-convertor-generator [option]

Options:
 -f, --file <file>                   excel file
 --fileDir <fileDir>                 excel file directory
 -o, --outdir <outdir>               output directory
 -h, --help                           show help message

Examples:

 $ ts-convertor-generator -f example.xlsx
 $ ts-convertor-generator --file example.xlsx -o ./out
 $ ts-convertor-generator -f example.xlsx -f example2.xlsx --outDir ./dist
 $ ts-convertor-generator --fileDir ./excel --outdir ./dist
` as const;

// run
{
  if (argv.help || argv.h) {
    echo`${HELP}`;
    Deno.exit(0);
  }
  let fileList: string[] = [];
  // get filenames
  const files = argv.f || argv.file;
  const fileDir = argv.fileDir;
  if (!files && !fileDir) {
    echo`you need to choose file`;
    echo`${HELP}`;
    Deno.exit(1);
  }
  if (typeof fileDir === "string") {
    const dir = Deno.readDirSync(fileDir);
    for await (const entry of dir) {
      if (entry.isFile && entry.name.endsWith(".xlsx")) {
        fileList = [...fileList, `${fileDir}/${entry.name}`];
      }
    }
  }
  if (files) {
    if (typeof files === "string") {
      fileList = [...fileList, files];
    } else if (Array.isArray(files)) {
      fileList = [...fileList, ...files];
    }
  }
  echo`check ${files}...`;
  // check file exist
  fileList.forEach((file) => {
    const isExists = fileExists(file);
    if (!isExists) {
      echo`file is not exists ${file}`;
      Deno.exit(1);
    }
  });
  // check file is excel
  const isNotExcel = fileList.some((file) => !file.endsWith(".xlsx"));
  if (isNotExcel) {
    echo`file is not excel`;
    Deno.exit(1);
  }

  const outDir = argv.o ?? argv.outDir ?? DEFAULT_OUTDIR;
  // delete outdir
  if (dirExists(outDir)) {
    Deno.removeSync(outDir, { recursive: true });
  }

  Deno.mkdirSync(outDir);

  const eta = new Eta();
  // exec every file
  fileList.forEach((file) => {
    const xlsxFileName = file.split(".")[0];
    // load message
    echo`load ${file}...`;
    const workbook = XLSX.readFile(file);

    // get sheet
    const targetSheet = workbook.Sheets[TARGET];
    if (!targetSheet) {
      echo`${file}: target sheet is not exists`;
      Deno.exit(1);
    }
    // get sheet data
    const targetData = XLSX.utils.sheet_to_json<TargetRow>(targetSheet);
    // generate ts file from sheet data
    const textEncorder = new TextEncoder();
    const filename = `${xlsxFileName.split("/").reverse()[0]}-converter.ts`;

    // write file
    Deno.writeFileSync(
      filename,
      textEncorder.encode(eta.renderString(TEMPLATE, {
        rows: targetData.map((row) => ({
          ...row,
          method: row.method
            ? `${row.method.replaceAll("?", `from.${row.from_property}`)}`
            : `from.${row.from_property}`,
        })),
      })),
    );
    // move file
    Deno.renameSync(filename, `${outDir}/${filename}`);
    echo`generated ${outDir}/${filename}`;
  });

  Deno.exit(0);
}
