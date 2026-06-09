// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var KW_SELECT: any;
declare var KW_FROM: any;
declare var KW_AS: any;
declare var KW_LEFT: any;
declare var KW_JOIN: any;
declare var IDENT: any;
declare var COMMA: any;
declare var WS: any;
declare var DOT: any;


import lexer from './sqlLexer';
import {toKeyword, toIdent} from './sqlLexer';

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "main", "symbols": ["select_statement"], "postprocess": id},
    {"name": "select_statement", "symbols": ["kw_select", "_", "select_list", "_", "kw_from", "_", "from_clause"], "postprocess": ([kw_select,_1,select_list,_2,kw_from,_3,from_clause])=>({type:'select_statement',
        																				   offset:kw_select.offset,
        																				   line:kw_select.line,
        																				   col:kw_select.col,
        																				   text:kw_select.text+_1.text+select_list.text+_2.text+kw_from.text+_3.text+from_clause.text,
          select_list:select_list.select_items,
          from_table: {source_table:{schema:from_clause.schema,
        																												  table:from_clause.table},
        																								   alias:from_clause.alias},
          line_breaks:_1.lineBreaks+_2.lineBreaks+_3.lineBreaks
         }
         
        )},
    {"name": "select_list$ebnf$1", "symbols": []},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$1", "symbols": ["_"], "postprocess": id},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$2", "symbols": ["_"], "postprocess": id},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "select_list$ebnf$1$subexpression$1", "symbols": ["select_list$ebnf$1$subexpression$1$ebnf$1", "comma", "select_list$ebnf$1$subexpression$1$ebnf$2", "select_item"]},
    {"name": "select_list$ebnf$1", "symbols": ["select_list$ebnf$1", "select_list$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "select_list", "symbols": ["select_item", "select_list$ebnf$1"], "postprocess": 
            d => {let v= [d[0], ...d[1].map((item: any) => item[3])];
        return {type:'select_list',
        				offset:v[0].offset,
        				line:v[0].line,
        				col:v[0].col,
        				text:[v.map((item: any) => item.text)].join(''),
        				select_items:v
        				}
         ;
        }
        },
    {"name": "select_item", "symbols": ["expression"], "postprocess": ([expression]) => ({type:'select_item',
        offset:expression.offset,
        line:expression.line,
        col:expression.col,
        text:expression.text,
        value:expression.value,
        source_columns:expression.source_columns,
        alias:null})},
    {"name": "select_item", "symbols": ["expression", "_", "alias"], "postprocess": ([expression,_,alias]) => ({type:'select_item',
        offset:expression.offset,
        line:expression.line,
        col:expression.col,
        text:expression.text+_.text+alias.text,
        value:expression.value+' AS '+alias.value,
        source_columns:expression.source_columns,
        alias:alias.value})},
    {"name": "from_clause", "symbols": ["table_ref"], "postprocess": id},
    {"name": "table_ref", "symbols": ["ident", "_", "alias"], "postprocess":  ([table,ws,alias]) => ({type:'table_ref',
        offset:table.offset,
        line:table.line,
        col:table.col,
        text:table.text+ws.text+alias.text,
        value:table.value+' AS '+alias.value,
        schema:null,
        table:table.value,
        alias:alias.value})},
    {"name": "table_ref", "symbols": ["ident", "dot", "ident", "_", "alias"], "postprocess":  ([schema,dot,table,_,alias]) => ({type:'table_ref',
        offset:schema.offset,
        text:schema.text+dot.text+table.text+_.text+alias.text,
        value:schema.value+dot.value+table.value+' AS '+alias.value,
        													        schema:schema.value,
        													        table:table.value,
        													        alias:alias.value})},
    {"name": "expression", "symbols": ["column_ref"], "postprocess": ([column_ref]) => ({type:'expression',
        offset:column_ref.offset,
        line:column_ref.line,
        col:column_ref.col,
        text:column_ref.text,
        value:column_ref.value,
        schema:null,
        source_columns:[{table:column_ref.table,column:column_ref.column}]})},
    {"name": "column_ref", "symbols": ["ident", "dot", "ident"], "postprocess":  ([table,dot,column]) => ({type:'column_ref',
        												        offset:table.offset,
        line:table.line,
        col:table.col,
        table:table.value,
        column:column.value,
        text:table.text+dot.text+column.text,
        value:table.value+dot.value+column.value})},
    {"name": "column_ref", "symbols": ["ident"], "postprocess":  ([column]) => ({type:'column_ref',
        offset:column.offset,
        line:column.line,
        col:column.col,
        table:null,
        column:column.value,
        text:column.text,
        value:column.value})},
    {"name": "alias", "symbols": ["kw_as", "_", "ident"], "postprocess":  ([as,_,alias]) => ({type:'alias',
        offset:as.offset,
        line:as.line,
        col:as.col,
        line_breaks:_.lineBreaks,
        text:as.text+_.text+alias.text,
        value:alias.value})},
    {"name": "alias", "symbols": ["ident"], "postprocess":  ([alias]) => ({type:'alias',
        offset:alias.offset,
        line:alias.line,
        col:alias.col,
        text:alias.text,
        value:alias.value})},
    {"name": "kw_select", "symbols": [(lexer.has("KW_SELECT") ? {type: "KW_SELECT"} : KW_SELECT)], "postprocess": ([d]) => toKeyword(d)},
    {"name": "kw_from", "symbols": [(lexer.has("KW_FROM") ? {type: "KW_FROM"} : KW_FROM)], "postprocess": ([d]) => toKeyword(d)},
    {"name": "kw_as", "symbols": [(lexer.has("KW_AS") ? {type: "KW_AS"} : KW_AS)], "postprocess": ([d]) => toKeyword(d)},
    {"name": "kw_left", "symbols": [(lexer.has("KW_LEFT") ? {type: "KW_LEFT"} : KW_LEFT)], "postprocess": ([d]) => toKeyword(d)},
    {"name": "kw_join", "symbols": [(lexer.has("KW_JOIN") ? {type: "KW_JOIN"} : KW_JOIN)], "postprocess": ([d]) => toKeyword(d)},
    {"name": "ident", "symbols": [(lexer.has("IDENT") ? {type: "IDENT"} : IDENT)], "postprocess": ([d]) => toIdent(d)},
    {"name": "comma", "symbols": [(lexer.has("COMMA") ? {type: "COMMA"} : COMMA)], "postprocess": ([d]) => toIdent(d)},
    {"name": "_", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": ([d]) => toIdent(d)},
    {"name": "dot", "symbols": [(lexer.has("DOT") ? {type: "DOT"} : DOT)], "postprocess": ([d]) => toIdent(d)}
  ],
  ParserStart: "main",
};

export default grammar;
