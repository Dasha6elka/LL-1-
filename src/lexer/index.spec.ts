import { lexer } from ".";

describe("lexer", () => {
    it("should pass", () => {
        let actual: string[] = [];
        actual = lexer.main("./lexer.txt", "./tokens.txt", actual);
        const expected: string[] = [];

        expected.push("CLASS class 1 1");
        expected.push("IDENTIFICATION Foo 1 7");
        expected.push("BRACE_OPEN { 1 11");
        expected.push("PRIVATE private 2 5");
        expected.push("DOUBLE double 2 13");
        expected.push("IDENTIFICATION big 2 20");
        expected.push("ASSIGNMENT = 2 24");
        expected.push("FLOAT_NUMBER 3.2e 2 26");
        expected.push("PLUS + 2 30");
        expected.push("INT_NUMBER 23 2 31");
        expected.push("SEMICOLON ; 2 33");
        expected.push("ONE_LINE_COMMENT // 2 35");
        expected.push("PRIVATE private 3 5");
        expected.push("DOUBLE double 3 13");
        expected.push("IDENTIFICATION small 3 20");
        expected.push("ASSIGNMENT = 3 26");
        expected.push("MINUS - 3 28");
        expected.push("FLOAT_NUMBER 4.70e-9 3 29");
        expected.push("SEMICOLON ; 3 36");
        expected.push("ONE_LINE_COMMENT // 3 38");
        expected.push("PRIVATE private 5 5");
        expected.push("STRING String 5 13");
        expected.push("IDENTIFICATION message 5 20");
        expected.push("ASSIGNMENT = 5 28");
        expected.push('STRING_PARAM "Foo >> " 5 30');
        expected.push("SEMICOLON ; 5 39");
        expected.push("PRIVATE private 7 5");
        expected.push("INT int 7 13");
        expected.push("IDENTIFICATION hex 7 17");
        expected.push("ASSIGNMENT = 7 21");
        expected.push("HEX 0x0A0B0C 7 23");
        expected.push("SEMICOLON ; 7 31");
        expected.push("PRIVATE private 8 5");
        expected.push("INT int 8 13");
        expected.push("IDENTIFICATION octal 8 17");
        expected.push("ASSIGNMENT = 8 23");
        expected.push("OCTAL 0737 8 25");
        expected.push("SEMICOLON ; 8 29");
        expected.push("PRIVATE private 9 5");
        expected.push("INT int 9 13");
        expected.push("IDENTIFICATION binary 9 17");
        expected.push("ASSIGNMENT = 9 24");
        expected.push("BINARY 0b01001001110 9 26");
        expected.push("SEMICOLON ; 9 39");
        expected.push("MULTILINE_COMMENT /* 11 5");
        expected.push("PUBLIC public 14 5");
        expected.push("VOID void 14 12");
        expected.push("IDENTIFICATION main 14 17");
        expected.push("BRACKET_OPEN ( 14 21");
        expected.push("STRING String 14 22");
        expected.push("SQUARE_BRACKETS_OPEN [ 14 28");
        expected.push("SQUARE_BRACKETS_CLOSE ] 14 29");
        expected.push("IDENTIFICATION args 14 31");
        expected.push("BRACKET_CLOSE ) 14 35");
        expected.push("BRACE_OPEN { 14 37");
        expected.push("INT int 15 9");
        expected.push("IDENTIFICATION size 15 13");
        expected.push("ASSIGNMENT = 15 18");
        expected.push("INT_NUMBER 3 15 20");
        expected.push("SEMICOLON ; 15 21");
        expected.push("INT int 16 9");
        expected.push("SQUARE_BRACKETS_OPEN [ 16 13");
        expected.push("IDENTIFICATION size 16 14");
        expected.push("SQUARE_BRACKETS_CLOSE ] 16 18");
        expected.push("IDENTIFICATION array 16 20");
        expected.push("ASSIGNMENT = 16 26");
        expected.push("BRACE_OPEN { 16 28");
        expected.push("INT_NUMBER 1 16 30");
        expected.push("COMMA , 16 31");
        expected.push("INT_NUMBER 2 16 33");
        expected.push("COMMA , 16 34");
        expected.push("INT_NUMBER 3 16 36");
        expected.push("BRACE_CLOSE } 16 38");
        expected.push("SEMICOLON ; 16 39");
        expected.push("WHILE while 17 9");
        expected.push("BRACKET_OPEN ( 17 15");
        expected.push("IDENTIFICATION index 17 16");
        expected.push("NOT_EQUAL != 17 22");
        expected.push("INT_NUMBER 0 17 25");
        expected.push("BRACKET_CLOSE ) 17 26");
        expected.push("BRACE_OPEN { 17 28");
        expected.push("IDENTIFICATION index 18 13");
        expected.push("ASSIGNMENT = 18 19");
        expected.push("IDENTIFICATION index 18 21");
        expected.push("MINUS - 18 27");
        expected.push("INT_NUMBER 1 18 29");
        expected.push("SEMICOLON ; 18 30");
        expected.push("VAR var 19 13");
        expected.push("IDENTIFICATION coefficient 19 17");
        expected.push("ASSIGNMENT = 19 29");
        expected.push("IDENTIFICATION big 19 31");
        expected.push("MULTIPLICATION * 19 35");
        expected.push("IDENTIFICATION small 19 37");
        expected.push("DIVISION / 19 43");
        expected.push("IDENTIFICATION hex 19 45");
        expected.push("SEMICOLON ; 19 48");
        expected.push("BRACE_CLOSE } 20 9");
        expected.push("FOR for 21 9");
        expected.push("BRACKET_OPEN ( 21 13");
        expected.push("VAR var 21 14");
        expected.push("IDENTIFICATION num 21 18");
        expected.push("COLON : 21 22");
        expected.push("IDENTIFICATION array 21 24");
        expected.push("BRACKET_CLOSE ) 21 29");
        expected.push("BRACE_OPEN { 21 31");
        expected.push("VAR var 22 13");
        expected.push("IDENTIFICATION coefficient 22 17");
        expected.push("ASSIGNMENT = 22 29");
        expected.push("IDENTIFICATION big 22 31");
        expected.push("MULTIPLICATION * 22 35");
        expected.push("IDENTIFICATION small 22 37");
        expected.push("DIVISION / 22 43");
        expected.push("IDENTIFICATION hex 22 45");
        expected.push("SEMICOLON ; 22 48");
        expected.push("BRACE_CLOSE } 23 9");
        expected.push("VAR var 24 9");
        expected.push("IDENTIFICATION secret 24 13");
        expected.push("ASSIGNMENT = 24 20");
        expected.push("IDENTIFICATION hex 24 22");
        expected.push("EXPONENTIATION ^ 24 26");
        expected.push("IDENTIFICATION octal 24 28");
        expected.push("EXPONENTIATION ^ 24 34");
        expected.push("IDENTIFICATION binary 24 36");
        expected.push("SEMICOLON ; 24 42");
        expected.push("IDENTIFICATION println 25 9");
        expected.push("BRACKET_OPEN ( 25 16");
        expected.push("IDENTIFICATION secret 25 17");
        expected.push("BRACKET_CLOSE ) 25 23");
        expected.push("SEMICOLON ; 25 24");
        expected.push("ERROR  in line 26 position 1");
        expected.push("ERROR  in line 26 position 2");
        expected.push("INT int 26 3");
        expected.push("IDENTIFICATION A 26 7");
        expected.push("ASSIGNMENT = 26 9");
        expected.push("INT_NUMBER 5 26 11");
        expected.push("SEMICOLON ; 26 12");
        expected.push("ERROR  in line 27 position 1");
        expected.push("ERROR  in line 27 position 2");
        expected.push("INT int 27 3");
        expected.push("IDENTIFICATION B 27 7");
        expected.push("ASSIGNMENT = 27 9");
        expected.push("INT_NUMBER 6 27 11");
        expected.push("SEMICOLON ; 27 12");
        expected.push("ERROR  in line 28 position 1");
        expected.push("ERROR  in line 28 position 2");
        expected.push("INT int 28 3");
        expected.push("IDENTIFICATION S 28 7");
        expected.push("ASSIGNMENT = 28 9");
        expected.push("INT_NUMBER 7 28 11");
        expected.push("SEMICOLON ; 28 12");
        expected.push("ERROR  in line 29 position 1");
        expected.push("ERROR  in line 29 position 2");
        expected.push("INT int 29 3");
        expected.push("IDENTIFICATION i 29 7");
        expected.push("ASSIGNMENT = 29 9");
        expected.push("INT_NUMBER 0 29 11");
        expected.push("SEMICOLON ; 29 12");
        expected.push("STRING String 31 9");
        expected.push("IDENTIFICATION string 31 16");
        expected.push("ASSIGNMENT = 31 23");
        expected.push(
            'STRING_PARAM " Земля конечно плоская                      причём ужасно жёсткая                      !!!!!!!" 31 25',
        );
        expected.push("SEMICOLON ; 31 31");
        expected.push("BRACE_CLOSE } 34 5");
        expected.push("BRACE_CLOSE } 35 1");

        expect(expected).toEqual(actual);
    });
});
