import _, { isNumber } from "lodash";
import { Row, Grammar, State, Literal } from "../common/common";
import { exceptions } from "./exceptions";
import { Lexer, Token, TokenType } from "lexer4js";
import { EMPTY } from "../common/constants";
import { SymbolsTable } from "./symbolsTable";

export namespace analyzer {
    type ExecError = exceptions.analyzer.IncorrectSequenceOrderException;

    export interface ExecResult {
        ok: boolean;
        error: ExecError | null;
    }

    export interface ExecResultFailed extends ExecResult {
        ok: boolean;
        error: ExecError | null;
        token: string;
        line: string;
        position: string;
    }

    interface Value {
        value: string;
        typeNum: TokenType;
    }

    export function exec(rows: Row[], grammars: Grammar[], tokensLexer: Token[], source: string): ExecResult {
        const nonTerminals: Literal[] = _.uniq(_.map(grammars, "nonTerminal"));

        const tokensStack: any[] = [];
        const inputStack: any[] = [];
        const statesStack: any[] = [];
        statesStack.push({
            value: State.S,
            index: 0,
        });

        const lexer = new Lexer();
        const tokensInput = lexer
            .tokenize(source)
            .map(token => `${token.type} ${token.literal} ${token.line} ${token.position}`);

        let offsetArray: string[] = getTokensSymbol(tokensInput, 0);
        let symbolsArray: string[] = getTokensSymbol(tokensInput, 1);
        let linesArray: string[] = getTokensSymbol(tokensInput, 2);
        let positionArray: string[] = getTokensSymbol(tokensInput, 3);

        const grammarsArray: Grammar[] = [];

        grammars.forEach(grammar => {
            let toks: string[] = [];
            grammar.rightPart.forEach(token => {
                if (token === EMPTY) {
                    return;
                }
                if (!nonTerminals.includes(token)) {
                    const lexer = new Lexer();
                    let tokInput = lexer.tokenize(token);

                    tokensLexer.forEach(t => {
                        if (token === t.literal && !toks.includes(t.type)) {
                            toks.push(t.type);
                        } else if (tokInput[0].type === t.type && !toks.includes(t.type)) {
                            toks.push(t.type);
                        }
                    });
                } else {
                    toks.push(token);
                }
            });
            grammarsArray.push({
                nonTerminal: grammar.nonTerminal,
                rightPart: toks,
                elements: grammar.elements,
            });
        });

        inputStack.push("END");
        for (let j = tokensInput.length - 1; j >= 0; j--) {
            const array = tokensInput[j].split(" ");
            inputStack.push(array[0]);
        }

        let end = false;
        let state = statesStack[statesStack.length - 1];
        let i: number = 0;
        let isParams = false;
        let isExpression = false;
        let isCondition = false;
        let type = "";
        const table = new SymbolsTable();
        table.create();
        let stack: string[] = [];
        let prevSymbol = "";
        let identifier = "";

        let value: Value = {
            value: "",
            typeNum: TokenType.INT,
        };

        let tokenList: string = "";
        let ast: (string | number | undefined)[][] = [];

        while (!end) {
            if (state.value === State.S) {
                const curr = inputStack[inputStack.length - 1];
                const symbol = symbolsArray[i];
                const isType = curr === "INT" || curr === "DOUBLE" || curr === "BOOLEAN";
                const isAssign = curr === "ASSIGNMENT";

                if (isType) {
                    isParams = true;
                    if (curr === "INT") {
                        type = "INT_LITERAL";
                    } else if (curr === "DOUBLE") {
                        type = "DOUBLE_LITERAL";
                    } else {
                        type = curr;
                    }
                }

                if (isAssign) {
                    identifier = prevSymbol;
                    isExpression = true;
                }

                if (symbol === ";" && curr === "SEMICOLON") {
                    if (isParams) {
                        isParams = false;
                    }
                    if (isExpression) {
                        ast.push(infixToPostfix(tokenize(tokenList)));
                        tokenList = "";
                        isExpression = false;
                    }
                }

                if (prevSymbol === "if" && symbol === "(") {
                    isCondition = true;
                }

                if (isCondition && symbol === ")") {
                    isCondition = false;
                }

                const a = table.isHas(symbol, type);

                if (isParams && curr === "IDENTIFIER" && !isType && !a) {
                    table.addSymbol(symbol, type, undefined);
                }

                const currRow = rows[state.index];
                let isError = true;

                currRow.value.forEach(cell => {
                    if (cell.column === curr) {
                        state = cell.value;

                        if (state === State.OK) {
                            end = true;
                            isError = false;
                            return;
                        }

                        if (state.value !== State.R) {
                            statesStack.push(state);
                            inputStack.pop();
                            tokensStack.push(curr);

                            if (nonTerminals.includes(curr)) {
                                i--;
                            } else if (!nonTerminals.includes(curr) && (isExpression || isCondition) && !isAssign) {
                                if (
                                    curr === "INT_LITERAL" ||
                                    curr === "DOUBLE_LITERAL" ||
                                    curr === "ADDITION" ||
                                    curr === "DIVISION" ||
                                    curr === "MULTIPLICATION" ||
                                    curr === "SUBTRACTION" ||
                                    curr === "TRUE" ||
                                    curr === "FALSE"
                                ) {
                                    stack.push(symbol);
                                    tokenList += `${symbol} `;
                                } else if (curr === "OPENING_BRACE" || curr === "CLOSING_BRACE") {
                                    tokenList += `${symbol} `;
                                } else if (curr === "IDENTIFIER" && isAssign) {
                                    const valueId = table.getValue(symbol);

                                    if (valueId !== undefined) {
                                        stack.push(valueId);
                                        tokenList += `${valueId} `;
                                    } else {
                                        const result: ExecResultFailed = {
                                            ok: false,
                                            error: new exceptions.analyzer.IncorrectUseUnassignedVariable(),
                                            token: offsetArray[i],
                                            line: linesArray[i],
                                            position: positionArray[i],
                                        };

                                        return result;
                                    }
                                }
                            }

                            i++;

                            isError = false;
                            return;
                        }

                        isError = false;
                    }
                });

                prevSymbol = symbol;

                if (isError) {
                    const result: ExecResultFailed = {
                        ok: false,
                        error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                        token: offsetArray[i],
                        line: linesArray[i],
                        position: positionArray[i],
                    };

                    return result;
                }
            } else if (state.value === State.R) {
                const grammar = grammarsArray[state.index];
                const rightPart: string[] = grammar.rightPart.reverse();

                if (rightPart.includes("EQUALS")) {
                    const right = stack.pop()!;
                    const left = stack.pop()!;

                    let tokRight = new Lexer().tokenize(right);
                    let tokLeft = new Lexer().tokenize(left);

                    if (!tokRight[0] && !tokLeft[0] && tokRight[0].type !== tokLeft[0].type) {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectTypeException(),
                            token: offsetArray[i],
                            line: linesArray[i],
                            position: positionArray[i],
                        };

                        return result;
                    }
                }

                if (rightPart.includes("ADDITION")) {
                    let second = stack.pop()!;
                    exp(stack, value, "ADDITION", second);
                }

                if (rightPart.includes("SUBTRACTION")) {
                    if (rightPart.length === 2) {
                        const number = stack.pop();
                        const minus = stack.pop();
                        if (minus === "-") {
                            stack.push(`${minus}${number}`);
                        } else {
                            const realMinus = stack.pop();
                            stack.push(`${realMinus}${minus}`, `${number}`);
                        }
                    } else {
                        let second = stack.pop()!;
                        exp(stack, value, "SUBTRACTION", second);
                    }
                }

                if (rightPart.includes("MULTIPLICATION")) {
                    let second = stack.pop()!;
                    exp(stack, value, "MULTIPLICATION", second);
                }

                if (rightPart.includes("DIVISION")) {
                    let second = stack.pop()!;
                    if (second === "0") {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                            token: offsetArray[i],
                            line: linesArray[i],
                            position: positionArray[i],
                        };

                        return result;
                    }
                    exp(stack, value, "DIVISION", second);
                }

                if (!isExpression && !isCondition && stack.length === 1 && value.value === '') {
                    let val = stack.pop()!;

                    if (val[0] === "-") {
                        val = val.replace("-", "");
                        value.value = `-${val}`;
                    } else {
                        value.value = val;
                    }

                    if (isInt(val)) {
                        value.typeNum = TokenType.INT_LITERAL;
                    } else {
                        value.typeNum = TokenType.DOUBLE_LITERAL;
                    }

                    if (rightPart.includes("INT_LITERAL")) {
                        value.typeNum = TokenType.INT_LITERAL;
                    } else if (rightPart.includes("DOUBLE_LITERAL")) {
                        value.typeNum = TokenType.DOUBLE_LITERAL;
                    } else if (rightPart.includes("TRUE") || rightPart.includes("FALSE")) {
                        value.typeNum = TokenType.BOOLEAN;
                    }
                }

                if (rightPart.includes("ASSIGNMENT")) {
                    const typeId = table.getType(identifier);
                    if (
                        (typeId === TokenType.INT_LITERAL && value.typeNum === TokenType.DOUBLE_LITERAL) ||
                        typeId !== value.typeNum
                    ) {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectTypeException(),
                            token: offsetArray[i],
                            line: linesArray[i],
                            position: positionArray[i],
                        };

                        return result;
                    } else {
                        if (typeId === TokenType.DOUBLE_LITERAL && isInt(value.value.toString())) {
                            table.update(identifier, `${value.value}.0`);
                        } else {
                            table.update(identifier, value.value.toString());
                        }
                        value.value = "";
                    }
                }

                for (let j = 0, i = rightPart.length - 1; j < rightPart.length, i >= 0; j++, i--) {
                    if (rightPart.length !== 0) {
                        const token = tokensStack.pop();
                        if (rightPart[j] !== token && rightPart[i] !== token) {
                            const result: ExecResultFailed = {
                                ok: false,
                                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                                token: offsetArray[i],
                                line: linesArray[i],
                                position: positionArray[i],
                            };

                            return result;
                        }
                    }
                }

                inputStack.push(grammar.nonTerminal);
                for (let j = 0; j < rightPart.length; j++) {
                    statesStack.pop();
                }
                state = statesStack[statesStack.length - 1];
            }
        }

        table.delete();

        const result: ExecResult = {
            ok: true,
            error: null,
        };

        return result;
    }

    function tokenize(exp: string): (string | number)[] {
        return exp
            .replace(/\s/g, "")
            .split("")
            .map(token => (/^\d$/.test(token) ? +token : token));
    }

    function infixToPostfix(infix: (string | number)[]): (string | number | undefined)[] {
        const presedences = ["-", "+", "*", "/"];

        var operationsStack = [],
            postfix = [];

        for (let token of infix) {
            if ("number" === typeof token) {
                postfix.push(token);
                continue;
            }

            let topOfStack = operationsStack[operationsStack.length - 1];
            if (!operationsStack.length || topOfStack == "(") {
                operationsStack.push(token);
                continue;
            }

            if (token == "(") {
                operationsStack.push(token);
                continue;
            }

            if (token == ")") {
                pushOperations(operationsStack, postfix);
                continue;
            }

            let prevPresedence = presedences.indexOf(topOfStack),
                currPresedence = presedences.indexOf(token);
            while (currPresedence < prevPresedence) {
                let op = operationsStack.pop();
                postfix.push(op);
                prevPresedence = presedences.indexOf(operationsStack[operationsStack.length - 1]);
            }
            operationsStack.push(token);
        }

        pushOperations(operationsStack, postfix);

        return postfix;
    }

    function pushOperations(opsStack: string[], postfix: (string | number | undefined)[]): void {
        while (opsStack.length) {
            let op = opsStack.pop();
            if (op == "(") break;
            postfix.push(op!);
        }
    }

    function getTokensSymbol(inputTokens: string[], position: number): string[] {
        let tokensArray: string[] = [];

        inputTokens.forEach(token => {
            const array = token.split(" ");
            tokensArray.push(array[position]);
        });

        return tokensArray;
    }

    function isInt(str: string): boolean {
        return /^\+?(0|[1-9]\d*)$/.test(str);
    }

    function exp(stack: string[], value: Value, name: string, second: string): Value {
        stack.pop();
        let first = stack.pop();
        if (second !== undefined && first !== undefined) {
            if (first[0] === "-") {
                first = first.replace("-", "");
                if (second[0] === "-") {
                    second = second.replace("-", "");
                    setValue(first, second, name, value, true, true);
                } else {
                    setValue(first, second, name, value, true, false);
                }
                stack.push(value.value.toString());
            } else if (second[0] === "-") {
                second = second.replace("-", "");
                setValue(first, second, name, value, false, true);
                stack.push(value.value.toString());
            } else {
                setValue(first, second, name, value, false, false);
                stack.push(value.value.toString());
            }
        }

        return value;
    }

    function setValue(
        first: string,
        second: string,
        name: string,
        value: Value,
        firstMinus: boolean,
        secondMinus: boolean,
    ): Value {
        let left = 0;
        let right = 0;

        if (isInt(second) && isInt(first)) {
            left = parseInt(first);
            right = parseInt(second);
            value.typeNum = TokenType.INT_LITERAL;
        } else {
            left = parseFloat(first);
            right = parseFloat(second);
            value.typeNum = TokenType.DOUBLE_LITERAL;
        }

        if (firstMinus) {
            left = -left;
        }
        if (secondMinus) {
            right = -right;
        }

        let val =
            name === "ADDITION"
                ? left + right
                : name === "MULTIPLICATION"
                ? left * right
                : name === "DIVISION"
                ? parseInt((left / right).toString())
                : left - right;
        value.value = val.toString();

        return value;
    }
}
