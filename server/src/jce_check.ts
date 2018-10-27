
const TOKEN_UNSIGNED = -99;
const TOKEN_VOID = -100;
const TOKEN_STRUCT = -101;
const TOKEN_BOOL = -102;
const TOKEN_BYTE = -103;
const TOKEN_SHORT = -104;
const TOKEN_INT = -105;
const TOKEN_DOUBLE = -106;
const TOKEN_FLOAT = -107;
const TOKEN_LONG = -108;
const TOKEN_STRING = -109;
const TOKEN_VECTOR = -110;
const TOKEN_MAP = -111;
const TOKEN_IDENTIFIER = -112;

const TOKEN_NAMESPACE = -113;
const TOKEN_INTERFACE = -114;
const TOKEN_OUT = -115;
const TOKEN_KEY = -116;
const TOKEN_ROUTE_KEY = -117;
const TOKEN_REQUIRE = -118;
const TOKEN_OPTIONAL = -119;
const TOKEN_INTEGER_LITERAL = -120;
const TOKEN_FLOATING_POINT_LITERAL = -121;
const TOKEN_FALSE = -122;
const TOKEN_TRUE = -123;
const TOKEN_STRING_LITERAL = -124;
const TOKEN_SCOPE_DELIMITER = -125;
const TOKEN_CONST = -126;
const TOKEN_ENUM = -127;
const TOKEN_EOF = -10000;
const TOKEN_LEX_ERROR = -10001;

function getKeyWordToken(id: string) {
    if (id === 'void') return TOKEN_VOID
    if (id === 'struct') return TOKEN_STRUCT
    if (id === 'bool') return TOKEN_BOOL
    if (id === 'byte') return TOKEN_BYTE
    if (id === 'short') return TOKEN_SHORT
    if (id === 'int') return TOKEN_INT
    if (id === 'double') return TOKEN_DOUBLE
    if (id === 'float') return TOKEN_FLOAT
    if (id === 'long') return TOKEN_LONG
    if (id === 'string') return TOKEN_STRING
    if (id === 'vector') return TOKEN_VECTOR
    if (id === 'map') return TOKEN_MAP
    if (id === 'module') return TOKEN_NAMESPACE
    if (id === 'interface') return TOKEN_INTERFACE
    if (id === 'out') return TOKEN_OUT
    if (id === 'key') return TOKEN_KEY
    if (id === 'routekey') return TOKEN_ROUTE_KEY
    if (id === 'require') return TOKEN_REQUIRE
    if (id === 'optional') return TOKEN_OPTIONAL
    if (id === 'false') return TOKEN_FALSE
    if (id === 'true') return TOKEN_TRUE
    if (id === 'const') return TOKEN_CONST
    if (id === 'enum') return TOKEN_ENUM
    if (id === 'unsigned') return TOKEN_UNSIGNED
    return 0; 
}
function getKeywordFromType(type: number) {
    if (type === TOKEN_VOID) return 'void'
    if (type === TOKEN_STRUCT) return 'struct'
    if (type === TOKEN_BOOL) return 'bool'
    if (type === TOKEN_BYTE) return 'byte'
    if (type === TOKEN_SHORT) return 'short'
    if (type === TOKEN_INT) return 'int'
    if (type === TOKEN_DOUBLE) return 'double'
    if (type === TOKEN_FLOAT) return 'float'
    if (type === TOKEN_LONG) return 'long'
    if (type === TOKEN_STRING) return 'string'
    if (type === TOKEN_VECTOR) return 'vector'
    if (type === TOKEN_MAP) return 'map'
    if (type === TOKEN_NAMESPACE) return 'module'
    if (type === TOKEN_INTERFACE) return 'interface'
    if (type === TOKEN_KEY) return 'key'
    if (type === TOKEN_ROUTE_KEY) return 'routekey'
    if (type === TOKEN_REQUIRE) return 'require'
    if (type === TOKEN_OPTIONAL) return 'optional'
    if (type === TOKEN_CONST) return 'const'
    if (type === TOKEN_ENUM) return 'enum'
    if (type === TOKEN_UNSIGNED) return 'unsigned'
    
    if (type === TOKEN_NAMESPACE) return "module"
    if (type === TOKEN_INTERFACE) return "interface"
    if (type === TOKEN_OUT) return "out"
    if (type === TOKEN_KEY) return "key"
    if (type === TOKEN_ROUTE_KEY) return "route"
    if (type === TOKEN_REQUIRE) return "reuqire"
    if (type === TOKEN_OPTIONAL) return "optional"
    if (type === TOKEN_INTEGER_LITERAL) return "integer_literal"
    if (type === TOKEN_FLOATING_POINT_LITERAL) return "float_literal"
    if (type === TOKEN_FALSE) return "false"
    if (type === TOKEN_TRUE) return "true"
    if (type === TOKEN_STRING_LITERAL) return "string_literal"
    if (type === TOKEN_SCOPE_DELIMITER) return "::"
    if (type === TOKEN_EOF) return "eof"
    if (type === TOKEN_LEX_ERROR) return "lex_error"
    
    return String.fromCharCode(type);
}

interface Token {
    type: number,
    startLine: number,
    startCol: number,
    endLine: number,
    endCol: number,
    msg: string
}

function getLexer(jce: string) {
    var len = jce.length
    var buff = jce;
    var pos = 0;
    var line = 0;
    var col = 0;

    function createToken(t: number, sl: number, sc: number, el: number, ec: number, m: string): Token {
        return {
            type: t,
            startLine: sl,
            startCol: sc,
            endLine: el,
            endCol: ec,
            msg: m
        }
    }

    function skipWhite() {
        while (pos < len &&
            (buff[pos] == ' ' ||
                buff[pos] == '\t' ||
                buff[pos] == '\r' ||
                buff[pos] == '\n')) {
            if (buff[pos] == '\n') {
                line = line + 1;
                col = 0;
            }
            else {
                col = col + 1
            }
            pos = pos + 1
        }
    }
    function lexString() {
        var sCol = col
        pos = pos + 1
        col = col + 1
        while (pos < len && buff[pos] != '\"') {
            pos += 1
            col += 1
        }
        if (pos == len) {
            return createToken(TOKEN_LEX_ERROR, line, sCol, line, col, 'string error');
        }
        pos = pos + 1;
        col = col + 1;
        return createToken(TOKEN_STRING_LITERAL, line, sCol, line, col, 'succ');
    }

    function lex(): Token {
        skipWhite();
        if (pos == len) {
            return createToken(TOKEN_EOF, 0, 0, 0, 0, 'EOF');
        }
        var c = buff[pos];
        if (c == ':') {
            if (buff[pos + 1] != ':') {
                return createToken(TOKEN_LEX_ERROR, line, pos, line, pos + 2, 'should be ::');
            }
            var tcol = col;
            col += 2;
            pos += 2;
            return createToken(TOKEN_SCOPE_DELIMITER, line, tcol, line, col, 'succ');
        }
        else if (c == '/') {
            if (buff[pos + 1] == '/') {
                while (buff[pos] != '\n') {
                    pos = pos + 1
                    col = col + 1
                }
                if (buff[pos] == '\n') {
                    pos = pos + 1;
                    line = line + 1;
                    col = 0
                }
                return lex();
            }
            //sikp block comment
            else if (buff[pos + 1] == '*') {
                pos = pos + 2;
                col = col + 2;
                while (!(buff[pos] == '*' && buff[pos + 1] == '/')) {
                    if (buff[pos] == '\n') {
                        line = line + 1
                        col = 0;
                        pos = pos + 1
                    }
                    else {
                        pos = pos + 1
                        col = col + 1
                    }

                }
                pos += 2;
                col += 2;
                return lex();
            }
            else {
                return createToken(TOKEN_LEX_ERROR, line, col, line, col + 2, 'should be // or /*');
            }
        }
        //sikp the include 
        else if (c == '#') {
            if (buff.substr(pos, 8) != '#include') {
                return createToken(TOKEN_LEX_ERROR, line, col, line, col + 8, 'include error');
            }
            pos += 8;
            col += 8;
            skipWhite();
            var stringToken = lexString();
            if (stringToken.type != TOKEN_STRING_LITERAL) {
                return stringToken;
            }
            return lex();
        }
        else if (c == '\"'){
            return lexString();
        }
        else if (('0' <= c && c <= '9') || c == '+' || c == '-') {
            sPos = pos;
            sCol = col;
            pos += 1;
            col += 1;
            var isFloat = false;
            while ( (buff[pos] <= '9' && buff[pos] >= '0') ||
                    (buff[pos] == '.')||
                    (buff[pos] >= 'a' && buff[pos] <= 'f')||
                    (buff[pos] >= 'A' && buff[pos]<= 'F')||
                    (buff[pos] == 'e') ||(buff[pos] == 'E')||
                    (buff[pos] == 'x') ||(buff[pos] == 'X')) {
                if (buff[pos] == '.') {
                    isFloat = true;
                }
                pos += 1;
                col += 1;
            }
            var number = buff.substr(sPos, pos - sPos)
            if (!isFloat) {
                return createToken(TOKEN_INTEGER_LITERAL, line, sCol, line, col, 'const integer' + number);
            }
            return createToken(TOKEN_FLOATING_POINT_LITERAL, line, sCol, line, col, 'const float' + number);
        }
        else if ('a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' || c == '_') {
            var sPos = pos;
            var sCol = col;
            while (pos < len &&
                    (buff[pos] == '_' ||
                    ('a' <= buff[pos] && buff[pos] <= 'z') ||
                    ('A' <= buff[pos] && buff[pos] <= 'Z') ||
                    ('0' <= buff[pos] && buff[pos] <= '9'))) {
                pos = pos + 1;
                col = col + 1;
            }
            var id = buff.substr(sPos, pos - sPos)
            var idToken = getKeyWordToken(id)
            if (idToken != 0) {
                return createToken(idToken, line, sCol, line, col, 'key word');
            }
            return createToken(TOKEN_IDENTIFIER, line, sCol, line, col, 'id');
        }
        //single char
        pos += 1;
        col += 1;
        return createToken(buff.charCodeAt(pos - 1), line, col - 1, line, col, 'single char');
    };
    return lex;
}

export default function JceCheck(jce: string) {
    let tokenVec: Token[] = []
    var lex = getLexer(jce)
    var token = lex();
    tokenVec.push(token);
    while (token.type != TOKEN_EOF && token.type != TOKEN_LEX_ERROR) {
        token = lex();
        tokenVec.push(token)
    }
    if (token.type == TOKEN_LEX_ERROR) {
        var ex = createParseError(token, 'lex error');
        throw ex;
    }
    var tPos = 0
    var tLen = tokenVec.length
    parseStart();

    function getCurrToken() {
        return tokenVec[tPos]
    }
    function nextToken() {
        if (tPos < tLen - 1) {
            tPos = tPos + 1
        }
    }
    function getCurrTokenAndNext() {
        var token = getCurrToken();
        nextToken();
        return token;
    }
    function createParseError(t: Token, m: string) {
        return {
            token: t,
            msg: m
        }
    }
    function tokenExcept(token: Token, type: number) {
        var emsg = 'except: ' + getKeywordFromType(type)
        if (token.type != type) {
            throw createParseError(token, emsg);
        }
    }
    function parseStart(): void {
        return parseNamespaces();
    }

    function parseNamespaces(): void {
        var token = getCurrToken();
        if (token.type == TOKEN_EOF) {
            return;
        }
        tokenExcept(token, TOKEN_NAMESPACE);
        parseNamespace();
        tokenExcept(getCurrTokenAndNext(), ';'.charCodeAt(0))
        return parseNamespaces();
    }
    function parseNamespace(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_NAMESPACE);
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        tokenExcept(getCurrTokenAndNext(), '{'.charCodeAt(0));
        parseDefintions();
        tokenExcept(getCurrTokenAndNext(), '}'.charCodeAt(0));
    }
    function parseDefintions(): void {
        var token = getCurrToken();
        if (token.type != TOKEN_INTERFACE &&
            token.type != TOKEN_STRUCT &&
            token.type != TOKEN_ENUM &&
            token.type != TOKEN_KEY &&
            token.type != TOKEN_CONST) {
            return;
        }
        parseDefinition();
        tokenExcept(getCurrTokenAndNext(), ';'.charCodeAt(0));
        parseDefintions();
    }
    function parseDefinition(): void {
        var token = getCurrToken();
        if (token.type == TOKEN_INTERFACE) {
            parseInterface();
        }
        else if (token.type == TOKEN_STRUCT) {
            parseStruct();
        }
        else if (token.type == TOKEN_ENUM) {
            parseEnum();
        }
        else if (token.type == TOKEN_KEY) {
            parseKey();
        }
        else if (token.type == TOKEN_CONST) {
            parseConst();
        }
    }
    function parseEnum(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_ENUM);
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        tokenExcept(getCurrTokenAndNext(), '{'.charCodeAt(0));
        parseEnumeratorList();
        tokenExcept(getCurrTokenAndNext(), '}'.charCodeAt(0));
    }
    function parseEnumeratorList(): void {
        var token = getCurrToken();
        if (token.type != TOKEN_IDENTIFIER) {
            return;
        };
        parseEnumerator();
        token = getCurrToken()
        if (token.type == ','.charCodeAt(0)) {
            tokenExcept(getCurrTokenAndNext(), ','.charCodeAt(0));
            parseEnumeratorList();
        }
    }
    function parseEnumerator(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        var token = getCurrToken();
        if (token.type == '='.charCodeAt(0)) {
            tokenExcept(getCurrTokenAndNext(), '='.charCodeAt(0));
            parseConstInitializer();
        }
    }
    function parseKey(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_KEY);
        tokenExcept(getCurrTokenAndNext(), '['.charCodeAt(0));
        parseScopedName();
        tokenExcept(getCurrTokenAndNext(), ','.charCodeAt(0));
        parseKeyMemebers();
        tokenExcept(getCurrTokenAndNext(), ']'.charCodeAt(0));
    }
    function parseKeyMemebers(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        var token = getCurrToken();
        if (token.type == ','.charCodeAt(0)) {
            tokenExcept(getCurrTokenAndNext(), ','.charCodeAt(0));
            parseKeyMemebers();
        }
    }
    function parseInterface(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_INTERFACE);
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        tokenExcept(getCurrTokenAndNext(), '{'.charCodeAt(0));
        parseInterfaceExports();
        tokenExcept(getCurrTokenAndNext(), '}'.charCodeAt(0));
    }
    function isType(type: number): boolean {
        return type <= TOKEN_UNSIGNED && type >= TOKEN_IDENTIFIER;
    }
    function parseInterfaceExports(): void {
        var token = getCurrToken();
        if (isType(token.type)) {
            parseType();
            tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
            tokenExcept(getCurrTokenAndNext(), '('.charCodeAt(0));
            parseParameters();
            tokenExcept(getCurrTokenAndNext(), ')'.charCodeAt(0));
            tokenExcept(getCurrTokenAndNext(), ';'.charCodeAt(0));
            parseInterfaceExports();
        }
    }
    function parseParameters(): void {
        var token = getCurrToken();
        if (token.type != TOKEN_OUT &&
            token.type != TOKEN_ROUTE_KEY &&
            !(isType(token.type))) {
            return;
        }
        if (token.type == TOKEN_OUT) {
            tokenExcept(getCurrTokenAndNext(), TOKEN_OUT);
        }
        if (token.type == TOKEN_ROUTE_KEY) {
            tokenExcept(getCurrTokenAndNext(), TOKEN_ROUTE_KEY);
        }
        parseTypeId();
        token = getCurrToken();
        if (token.type == ','.charCodeAt(0)) {
            tokenExcept(getCurrTokenAndNext(), ','.charCodeAt(0))
            parseParameters();
        }
    }
    function parseTypeId(): void {
        parseType();
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
    }
    function parseType(): void {
        var token = getCurrToken();
        if (token.type == TOKEN_UNSIGNED) {
            tokenExcept(getCurrTokenAndNext(), TOKEN_UNSIGNED);
            token = getCurrToken();
            if (token.type == TOKEN_BYTE ||
                token.type == TOKEN_SHORT ||
                token.type == TOKEN_INT) {
                return nextToken();
            }
            else {
                throw createParseError(token, 'should be byte,short,or int');
            }
        }
        else if (
            token.type == TOKEN_BOOL ||
            token.type == TOKEN_BYTE ||
            token.type == TOKEN_SHORT ||
            token.type == TOKEN_INT ||
            token.type == TOKEN_LONG ||
            token.type == TOKEN_FLOAT ||
            token.type == TOKEN_DOUBLE ||
            token.type == TOKEN_STRING) {
            nextToken();
        }
        else if (token.type == TOKEN_VECTOR) {
            parseVector();
        }
        else if (token.type == TOKEN_MAP) {
            parseMap();
        }
        else if (token.type == TOKEN_IDENTIFIER) {
            parseScopedName();
        }
    }
    function parseVector(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_VECTOR);
        tokenExcept(getCurrTokenAndNext(), '<'.charCodeAt(0));
        parseType();
        tokenExcept(getCurrTokenAndNext(), '>'.charCodeAt(0));
    }
    function parseMap(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_MAP);
        tokenExcept(getCurrTokenAndNext(), '<'.charCodeAt(0));
        parseType();
        tokenExcept(getCurrTokenAndNext(), ','.charCodeAt(0));
        parseType();
        tokenExcept(getCurrTokenAndNext(), '>'.charCodeAt(0));
    }
    function parseScopedName(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        var token = getCurrToken();
        if (token.type == TOKEN_SCOPE_DELIMITER) {
            tokenExcept(getCurrTokenAndNext(), TOKEN_SCOPE_DELIMITER);
            parseScopedName();
        }
    }

    function parseStruct(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_STRUCT);
        tokenExcept(getCurrTokenAndNext(), TOKEN_IDENTIFIER);
        tokenExcept(getCurrTokenAndNext(), '{'.charCodeAt(0));
        parseStructExports();
        tokenExcept(getCurrTokenAndNext(), '}'.charCodeAt(0));
    }
    function parseStructExports(): void {
        var token = getCurrToken();
        if (token.type == TOKEN_INTEGER_LITERAL) {
            parseDataMember();
            tokenExcept(getCurrTokenAndNext(), ';'.charCodeAt(0));
            parseStructExports();
        }
    }
    function parseDataMember(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_INTEGER_LITERAL);
        var token = getCurrToken();
        if (token.type == TOKEN_REQUIRE ||
            token.type == TOKEN_OPTIONAL) {
            nextToken();
            parseTypeId();
            token = getCurrToken();
            if (token.type == '='.charCodeAt(0)) {
                tokenExcept(getCurrTokenAndNext(), '='.charCodeAt(0));
                parseConstInitializer();
            }
        }
        else {
            throw createParseError(token, 'should be optional or require')
        }
    }
    function parseConstInitializer(): void {
        var token = getCurrToken();
        if (token.type == TOKEN_INTEGER_LITERAL ||
            token.type == TOKEN_FLOATING_POINT_LITERAL ||
            token.type == TOKEN_STRING_LITERAL ||
            token.type == TOKEN_FALSE ||
            token.type == TOKEN_TRUE) {
            nextToken();
        }
        else if (token.type == TOKEN_IDENTIFIER) {
            parseScopedName();
        }
        else {
            throw createParseError(token, 'should be const value');
        }
    }
    function parseConst(): void {
        tokenExcept(getCurrTokenAndNext(), TOKEN_CONST);
        parseTypeId();
        tokenExcept(getCurrTokenAndNext(), '='.charCodeAt(0));
        parseConstInitializer();
    }
}



