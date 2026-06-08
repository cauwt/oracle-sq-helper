// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var WS: any;
declare var KW_SELECT: any;
declare var KW_FROM: any;
declare var COMMA: any;
declare var IDENT: any;
declare var DOT: any;
declare var KW_AS: any;


import lexer from './sqlLexer';


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
    {"name": "select_statement$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "select_statement$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "select_statement", "symbols": ["select_statement$ebnf$1", (lexer.has("KW_SELECT") ? {type: "KW_SELECT"} : KW_SELECT), (lexer.has("WS") ? {type: "WS"} : WS), "select_list", (lexer.has("WS") ? {type: "WS"} : WS), (lexer.has("KW_FROM") ? {type: "KW_FROM"} : KW_FROM), (lexer.has("WS") ? {type: "WS"} : WS), "from_clause"]},
    {"name": "select_list$ebnf$1", "symbols": []},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "select_list$ebnf$1$subexpression$1", "symbols": ["select_list$ebnf$1$subexpression$1$ebnf$1", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "select_list$ebnf$1$subexpression$1$ebnf$2", "select_item"]},
    {"name": "select_list$ebnf$1", "symbols": ["select_list$ebnf$1", "select_list$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "select_list", "symbols": ["select_item", "select_list$ebnf$1"]},
    {"name": "select_item", "symbols": ["expression"]},
    {"name": "select_item", "symbols": ["expression", (lexer.has("WS") ? {type: "WS"} : WS), "alias"]},
    {"name": "from_clause", "symbols": ["table_ref"]},
    {"name": "table_ref", "symbols": [(lexer.has("IDENT") ? {type: "IDENT"} : IDENT), (lexer.has("WS") ? {type: "WS"} : WS), "alias"], "postprocess": ([table,ws,alias]) => ({type:'table_ref',offset:table.offset,text:table.text+ws.text+alias.text})},
    {"name": "table_ref", "symbols": [(lexer.has("IDENT") ? {type: "IDENT"} : IDENT), (lexer.has("DOT") ? {type: "DOT"} : DOT), (lexer.has("IDENT") ? {type: "IDENT"} : IDENT), (lexer.has("WS") ? {type: "WS"} : WS), "alias"], "postprocess": ([schema,dot,table]) => ({type:'table_ref',offset:schema.offset,text:schema.text+dot.text+table.text})},
    {"name": "expression", "symbols": ["column_ref"]},
    {"name": "column_ref", "symbols": [(lexer.has("IDENT") ? {type: "IDENT"} : IDENT), (lexer.has("DOT") ? {type: "DOT"} : DOT), (lexer.has("IDENT") ? {type: "IDENT"} : IDENT)], "postprocess": ([table,dot,column]) => ({type:'column_ref',offset:table.offset,text:table.text+dot.text+column.text})},
    {"name": "column_ref", "symbols": [(lexer.has("IDENT") ? {type: "IDENT"} : IDENT)], "postprocess": ([column]) => ({type:'column_ref',offset:column.offset,text:column.text})},
    {"name": "alias", "symbols": [(lexer.has("KW_AS") ? {type: "KW_AS"} : KW_AS), (lexer.has("WS") ? {type: "WS"} : WS), (lexer.has("IDENT") ? {type: "IDENT"} : IDENT)], "postprocess": ([as,ws,alias]) => ({type:'alias',offset:as.offset,text:as.text+ws.text+alias.text})},
    {"name": "alias", "symbols": [(lexer.has("IDENT") ? {type: "IDENT"} : IDENT)], "postprocess": ([alias]) => ({type:'alias',offset:alias.offset,text:alias.text})}
  ],
  ParserStart: "main",
};

export default grammar;
