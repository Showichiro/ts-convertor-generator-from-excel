# ts-convertor-generator

[![status](https://github.com/Showichiro/ts-convertor-generator-from-excel/actions/workflows/deno.yml/badge.svg)](https://github.com/Showichiro/ts-convertor-generator-from-excel/actions/workflows/deno.yml)

## install

```sh
deno install -A https://raw.githubusercontent.com/Showichiro/ts-convertor-generator-from-excel/main/ts-convertor-generator.ts
```

## Usage

```console
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
```
