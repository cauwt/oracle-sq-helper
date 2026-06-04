// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo");
	const lexer = moo.compile({
	  WS:{match:/[ \t\r\n]+/, lineBreaks:true},
	  IDENT: {match:/[a-zA-Z_][a-zA-Z0-9_]*/,type: moo.keywords({
		  'KW_SELECT':['select','SELECT'],
		  'KW_FROM':['from','FROM'],
		  'KW_AS':['as','AS'],
		  'KW_LEFT':['left','LEFT'],
		  'KW_JOIN':['join','JOIN'],
		  'KW_ON':['on','ON'],
		  'KW_AND':['and','AND'],
		  'KW_OR':['or','OR'],
		  'KW_WHERE':['left','LEFT'],
	  })},
	  NUMBER: /[0-9]+/,
	  COMMA: ',',
	  DOT: '.',
	  LPAREN:'(',
	  RPAREN:')',
	  OPR:['<=','>=','!=','<>','<','>','=']
	});

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["select_statement"], "postprocess": id},
    {"name": "select_statement$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "select_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "select_statement", "symbols": ["select_statement$ebnf$1", (lexer.has("KW_SELECT") ? {type: "KW_SELECT"} : KW_SELECT), (lexer.has("WS") ? {type: "WS"} : WS), "select_list", (lexer.has("WS") ? {type: "WS"} : WS), (lexer.has("KW_FROM") ? {type: "KW_FROM"} : KW_FROM), (lexer.has("WS") ? {type: "WS"} : WS), "from_clause"]},
    {"name": "select_list$ebnf$1", "symbols": []},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "select_list$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "select_list$ebnf$1$subexpression$1", "symbols": ["select_list$ebnf$1$subexpression$1$ebnf$1", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "select_list$ebnf$1$subexpression$1$ebnf$2", "select_item"]},
    {"name": "select_list$ebnf$1", "symbols": ["select_list$ebnf$1", "select_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
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
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
