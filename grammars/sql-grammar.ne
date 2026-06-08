@preprocessor typescript
@{%

import lexer from './sqlLexer';

%}
# Pass your lexer with @lexer:
@lexer lexer

# ==================== 主入口规则 ====================

# 主入口 - 解析整个 SQL 语句
main -> select_statement {% id %}

# ==================== 主规则 ====================

# SELECT 语句
select_statement -> 
    %WS:? %KW_SELECT %WS select_list
    %WS %KW_FROM %WS from_clause

# ==================== SELECT 列表 ====================

select_list -> select_item (%WS:? %COMMA %WS:? select_item):*

select_item -> 
    expression |
    expression %WS alias 


# ==================== FROM 子句 ====================

from_clause -> table_ref

# 表引用（必须带别名）
table_ref -> %IDENT %WS alias{% ([table,ws,alias]) => ({type:'table_ref',offset:table.offset,text:table.text+ws.text+alias.text})%}
| %IDENT %DOT %IDENT %WS alias{% ([schema,dot,table]) => ({type:'table_ref',offset:schema.offset,text:schema.text+dot.text+table.text})%}


# ==================== 表达式 ====================
expression -> column_ref

# 列引用（必须带表别名）
# 注意：这里暂时允许不带别名的列引用，验证在解析器中进行
column_ref -> %IDENT %DOT %IDENT{% ([table,dot,column]) => ({type:'column_ref',offset:table.offset,text:table.text+dot.text+column.text})%}
         | %IDENT{% ([column]) => ({type:'column_ref',offset:column.offset,text:column.text})%}

# 别名
alias -> %KW_AS %WS %IDENT{% ([as,ws,alias]) => ({type:'alias',offset:as.offset,text:as.text+ws.text+alias.text})%}
    | %IDENT{% ([alias]) => ({type:'alias',offset:alias.offset,text:alias.text})%}