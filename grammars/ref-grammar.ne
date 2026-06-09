@{%
// 辅助函数
function flatten(arr) {
    return arr.reduce((acc, val) => acc.concat(val), []);
}

function getOriginalText(d) {
    // 获取原始文本（简化实现）
    return d.join('');
}
%}

# ==================== 主入口规则 ====================

# 主入口 - 解析整个 SQL 语句
main -> _ select_statement _ {% d => d[1] %}

# ==================== 词法规则 ====================

# 空白字符
_ -> [\s]:* {% () => null %}
__ -> [\s]:+ {% () => null %}

# 标识符（不带引号）
identifier -> [a-zA-Z_] [a-zA-Z0-9_]:* {% 
    d => d[0] + d[1].join('') 
%}

# 带引号的标识符（支持双引号）
quoted_identifier -> "\"" [^\"]:* "\"" {% 
    d => d[1].join('') 
%}

# 标识符（带引号或不带引号）
ident -> identifier {% id %}
    | quoted_identifier {% id %}
# 数字
number -> [0-9]:+ {% 
    d => parseInt(d[0].join('')) 
%}
    | [0-9]:+ "." [0-9]:+ {% 
    d => parseFloat(d[0].join('') + '.' + d[2].join('')) 
%}
# 字符串（单引号）
string -> "'" [^']:* "'" {% 
    d => d[1].join('') 
%}

# 逗号
comma -> _ "," _ {% () => null %}

# ==================== 关键字（大小写不敏感） ====================

KW_SELECT -> "SELECT" | "select" {% () => 'SELECT' %}
KW_FROM -> "FROM" | "from" {% () => 'FROM' %}
KW_AS -> "AS" | "as" {% () => 'AS' %}
KW_WHERE -> "WHERE" | "where" {% () => 'WHERE' %}
KW_ON -> "ON" | "on" {% () => 'ON' %}
KW_AND -> "AND" | "and" {% () => 'AND' %}
KW_OR -> "OR" | "or" {% () => 'OR' %}
KW_NOT -> "NOT" | "not" {% () => 'NOT' %}
KW_IN -> "IN" | "in" {% () => 'IN' %}
KW_IS -> "IS" | "is" {% () => 'IS' %}
KW_NULL -> "NULL" | "null" {% () => 'NULL' %}
KW_TRUE -> "TRUE" | "true" {% () => true %}
KW_FALSE -> "FALSE" | "false" {% () => false %}
KW_CASE -> "CASE" | "case" {% () => 'CASE' %}
KW_WHEN -> "WHEN" | "when" {% () => 'WHEN' %}
KW_THEN -> "THEN" | "then" {% () => 'THEN' %}
KW_ELSE -> "ELSE" | "else" {% () => 'ELSE' %}
KW_END -> "END" | "end" {% () => 'END' %}

# JOIN 关键字
KW_JOIN -> "JOIN" | "join" {% () => 'JOIN' %}
KW_INNER -> "INNER" | "inner" {% () => 'INNER' %}
KW_LEFT -> "LEFT" | "left" {% () => 'LEFT' %}
KW_RIGHT -> "RIGHT" | "right" {% () => 'RIGHT' %}
KW_FULL -> "FULL" | "full" {% () => 'FULL' %}
KW_CROSS -> "CROSS" | "cross" {% () => 'CROSS' %}
KW_OUTER -> "OUTER" | "outer" {% () => 'OUTER' %}

# ==================== 主规则 ====================

# SELECT 语句
select_statement -> 
    KW_SELECT __ select_list 
    __ KW_FROM __ from_clause
    join_clauses:?
    _ {%
    d => ({
        type: 'select',
        columns: d[2],
        from: d[6],
        joins: d[7] || []
    })
%}

# ==================== SELECT 列表 ====================

select_list -> select_item (comma select_item):* {%
    d => [d[0], ...d[1].map(item => item[1])]
%}

select_item -> 
    "*" {% 
        d => ({ expression: { type: 'star' }, originalText: '*' })
    %}
    | expression _ alias:? {%
    d => ({
        expression: d[0],
        alias: d[2]||(d[0].type=='column_ref'?d[0].column:null),
        originalText: null  // 将在后处理中填充
    })
%}

alias -> KW_AS __ ident {% d => d[2] %}
    | __ ident {% d => d[1] %}

# ==================== FROM 子句 ====================

from_clause -> table_reference {% d => ({ table: d[0], originalText: null }) %}
    | subquery _ alias {% 
        d => ({ 
            table: { type: 'subquery', query: d[0], alias: d[2] },
            originalText: null 
        })
    %}

# 表引用（必须带别名）
table_reference -> ident _ alias {%
    d => {
        const tableName = d[0];
        const alias = d[2];
        // 检查是否有 schema
        const parts = tableName.split('.');
        if (parts.length === 2) {
            return { schema: parts[0], table: parts[1], alias };
        }
        return { table: tableName, alias };
    }
%}
    | ident "." ident _ alias {%
    d => ({
        schema: d[0],
        table: d[2],
        alias: d[4]
    })
%}

# ==================== JOIN 子句 ====================

join_clauses -> join_clause:+ {% d => d[0] %}

join_clause -> _ join_type _ KW_JOIN _ table_reference _ KW_ON _ join_condition {%
    d => ({
        type: d[1],
        table: d[5],
        conditions: d[9],
        originalText: null
    })
%}

join_type -> KW_LEFT _ KW_OUTER:? {% () => 'left' %}
    | KW_RIGHT _ KW_OUTER:? {% () => 'right' %}
    | KW_FULL _ KW_OUTER:? {% () => 'full' %}
    | KW_INNER {% () => 'inner' %}
    | KW_CROSS {% () => 'cross' %}
    | null {% () => 'inner' %}

join_condition -> join_condition_item (join_condition_logic join_condition_item):* {%
    d => {
        const result = [d[0]];
        for (const item of d[1]) {
            result.push({ logic: item[0], expression: item[1].expression });
        }
        return result;
    }
%}

join_condition_item -> expression {%
    d => ({ logic: 'and', expression: d[0] })
%}

join_condition_logic -> _ KW_AND _ {% () => 'and' %}
    | _ KW_OR _ {% () => 'or' %}

# ==================== 表达式 ====================

# 使用优先级爬升法处理二元运算符
expression -> or_expression {% id %}

or_expression -> and_expression (or_operator and_expression):* {%
    d => {
        let result = d[0];
        for (const item of d[1]) {
            result = {
                type: 'binary_expression',
                operator: item[0],
                left: result,
                right: item[1]
            };
        }
        return result;
    }
%}

or_operator -> _ KW_OR _ {% () => 'OR' %}

and_expression -> comparison_expression (and_operator comparison_expression):* {%
    d => {
        let result = d[0];
        for (const item of d[1]) {
            result = {
                type: 'binary_expression',
                operator: item[0],
                left: result,
                right: item[1]
            };
        }
        return result;
    }
%}

and_operator -> _ KW_AND _ {% () => 'AND' %}

comparison_expression -> additive_expression (comparison_operator additive_expression):? {%
    d => {
        if (d[1]) {
            return {
                type: 'binary_expression',
                operator: d[1][0],
                left: d[0],
                right: d[1][1]
            };
        }
        return d[0];
    }
%}

comparison_operator -> _ "=" _ {% () => '=' %}
    | _ "!" "=" _ {% () => '!=' %}
    | _ "<" ">" _ {% () => '<>' %}
    | _ "<" _ {% () => '<' %}
    | _ ">" _ {% () => '>' %}
    | _ "<" "=" _ {% () => '<=' %}
    | _ ">" "=" _ {% () => '>=' %}

additive_expression -> multiplicative_expression (additive_operator multiplicative_expression):* {%
    d => {
        let result = d[0];
        for (const item of d[1]) {
            result = {
                type: 'binary_expression',
                operator: item[0],
                left: result,
                right: item[1]
            };
        }
        return result;
    }
%}

additive_operator -> _ "+" _ {% () => '+' %}
    | _ "-" _ {% () => '-' %}

multiplicative_expression -> unary_expression (multiplicative_operator unary_expression):* {%
    d => {
        let result = d[0];
        for (const item of d[1]) {
            result = {
                type: 'binary_expression',
                operator: item[0],
                left: result,
                right: item[1]
            };
        }
        return result;
    }
%}

multiplicative_operator -> _ "*" _ {% () => '*' %}
    | _ "/" _ {% () => '/' %}
    | _ "%" _ {% () => '%' %}

unary_expression -> unary_operator primary_expression {%
    d => ({
        type: 'unary_expression',
        operator: d[0],
        argument: d[1]
    })
%}
    | primary_expression {% id %}

unary_operator -> KW_NOT _ {% () => 'NOT' %}
    | "+" _ {% () => '+' %}
    | "-" _ {% () => '-' %}

primary_expression -> column_ref {% id %}
    | literal {% id %}
    | function_call {% id %}
    | case_expression {% id %}
    | subquery {% id %}
    | "(" _ expression _ ")" {% d => d[2] %}

# 列引用（必须带表别名）
# 注意：这里暂时允许不带别名的列引用，验证在解析器中进行
column_ref -> ident "." ident {%
    d => ({
        type: 'column_ref',
        table: d[0],
        column: d[2]
    })
%}
    | ident {%
    d => ({
        type: 'column_ref',
        table: null,  // 标记为需要验证
        column: d[0]
    })
%}

# 字面量
literal -> string {%
    d => ({
        type: 'literal',
        value: d[0],
        dataType: 'string'
    })
%}
    | number {%
    d => ({
        type: 'literal',
        value: d[0],
        dataType: 'number'
    })
%}
    | KW_NULL {%
    d => ({
        type: 'literal',
        value: null,
        dataType: 'null'
    })
%}
    | KW_TRUE {%
    d => ({
        type: 'literal',
        value: true,
        dataType: 'boolean'
    })
%}
    | KW_FALSE {%
    d => ({
        type: 'literal',
        value: false,
        dataType: 'boolean'
    })
%}

# 函数调用
function_call -> ident "(" _ function_args:? _ ")" {%
    d => ({
        type: 'function_call',
        name: d[0],
        arguments: d[3] || []
    })
%}

function_args -> expression (comma expression):* {%
    d => [d[0], ...d[1].map(item => item[1])]
%}

# CASE WHEN 表达式
case_expression -> KW_CASE _ case_when_clauses _ case_else_clause:? _ KW_END {%
    d => ({
        type: 'case_expression',
        cases: d[2],
        elseResult: d[4]
    })
%}

case_when_clauses -> case_when_clause (_ case_when_clause):* {%
    d => [d[0], ...d[1].map(item => item[1])]
%}

case_when_clause -> KW_WHEN _ expression _ KW_THEN _ expression {%
    d => ({
        condition: d[2],
        result: d[6]
    })
%}

case_else_clause -> KW_ELSE _ expression {%
    d => d[2]
%}

# 子查询
subquery -> "(" _ select_statement _ ")" {%
    d => d[2]
%}