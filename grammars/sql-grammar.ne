@preprocessor typescript
@{%

import lexer from './sqlLexer';
import {toKeyword, toIdent} from './sqlLexer';
%}
# Pass your lexer with @lexer:
@lexer lexer

# ==================== 主入口规则 ====================

# 主入口 - 解析整个 SQL 语句
main -> select_statement {% id %}

# ==================== 主规则 ====================

# SELECT 语句
select_statement -> 
    kw_select _ select_list
    _ kw_from _ from_clause

# ==================== SELECT 列表 ====================

select_list -> select_item (_:? comma _:? select_item):*
{%
    d => [d[0], ...d[1].map((item: any) => item[3])]
%}

select_item -> 
    expression {%([column_ref]) => ({type:'select_item',
									 offset:column_ref.offset,
									 line:column_ref.line,
									 col:column_ref.col,
									 text:column_ref.text,
									 value:column_ref.value,
									 alias:null})%}
	| expression _ alias {%([column_ref,_,alias]) => ({type:'select_item',
													   offset:column_ref.offset,
													   line:column_ref.line,
													   col:column_ref.col,
													   text:column_ref.text+_.text+alias.text,
													   value:column_ref.value+' AS '+alias.value,
													   alias:alias.value})%}


# ==================== FROM 子句 ====================

from_clause -> table_ref {%id%}  

# 表引用（必须带别名）
table_ref -> ident _ alias{% ([table,ws,alias]) => ({type:'table_ref',
													 offset:table.offset,
													 line:table.line,
													 col:table.col,
													 text:table.text+ws.text+alias.text,
													 value:table.value+' AS '+alias.value,
													 schema:null,
													 table:table.value,
													 alias:alias.value})%}
| ident dot ident _ alias{% ([schema,dot,table,_,alias]) => ({type:'table_ref',
															  offset:schema.offset,
															  text:schema.text+dot.text+table.text+_.text+alias.text,
															  value:schema.value+dot.value+table.value+' AS '+alias.value,
													        schema:schema.value,
													        table:table.value,
													        alias:alias.value})%}


# ==================== 表达式 ====================
expression -> column_ref {%id%}

# 列引用（必须带表别名）
# 注意：这里暂时允许不带别名的列引用，验证在解析器中进行
column_ref -> ident dot ident{% ([table,dot,column]) => ({type:'column_ref',
												offset:table.offset,
														  line:table.line,
														  col:table.col,
														  table:table.value,
														  column:column.value,
														  text:table.text+dot.text+column.text,
														  value:table.value+dot.value+column.value})%}
         | ident{% ([column]) => ({type:'column_ref',
								   offset:column.offset,
								   line:column.line,
								   col:column.col,
								   table:null,
								   column:column.value,
								   text:column.text,
								   value:column.value})%}

# 别名
alias -> kw_as _ ident{% ([as,ws,alias]) => ({type:'alias',
											  offset:as.offset,
											  line:as.line,
											  col:as.col,
											  text:as.text+ws.text+alias.text,
											  value:alias.value})%}
    | ident{% ([alias]) => ({type:'alias',
							 offset:alias.offset,
							 line:alias.line,
							 col:alias.col,
							 text:alias.text,
							 value:alias.value})%}

# =========================关键词======================================
kw_select -> %KW_SELECT{%([d]) => toKeyword(d)%}
kw_from -> %KW_FROM{%([d]) => toKeyword(d)%}
kw_as -> %KW_AS{%([d]) => toKeyword(d)%}
kw_left -> %KW_LEFT{%([d]) => toKeyword(d)%}
kw_join -> %KW_JOIN{%([d]) => toKeyword(d)%}
ident -> %IDENT{%([d]) => toIdent(d)%}
comma -> %COMMA {%([d]) => toIdent(d)%}
_ -> %WS {%([d]) => toIdent(d)%}
dot -> %DOT {%([d]) => toIdent(d)%}

