import * as moo from 'moo';

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
	OPR:['<=','>=','!=','<>','<','>','='],
    error: { match: /[^]/, error: true }   // 捕获任何无法匹配的字符
});
   export function toKeyword(d:moo.Token){
	   let v=d;
	   v.type=d.type?.toLowerCase();
	   v.value=v.value.toUpperCase();
	   return v;
   };
   export function toIdent(d:moo.Token){
	   let v=d;
	   v.type=d.type?.toLowerCase();
	   v.value=v.value.toLowerCase();
	   return v;
   };

export default lexer;
export type Token = moo.Token;