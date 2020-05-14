export type Literal = Symbol;

export type Pointer = number | null;

export type LiteralSet = Set<Literal>;

export interface LiteralOption {
    rule: Literal;
    first: LiteralSet;
    grammar: LiteralSet;
}

export type LiteralOptions = Set<LiteralOption>

export interface LiteralToken {
    rule: Literal;
    first: LiteralSet;
    pointer: Pointer;
    offset: boolean;
    error: boolean;
    stack: boolean;
    end: boolean;
}

export type TokenTable = Map<number, LiteralToken>;

export type Stack<T> = T[];

export enum SymbolType {
    Terminal,
    Empty,
    Nonterminal,
}

export interface InputToken {
    visit(table: TokenTable): void;
}

export class LiteralIterator implements Iterator<Literal> {
    private index = 0;
    private readonly length: number;
    private readonly it: Iterator<Literal>;

    constructor(private readonly literals: Literal[]) {
        this.it = literals[Symbol.iterator]();
        this.length = literals.length;
    }

    next(): IteratorResult<Literal> {
        return {
            value: this.it.next().value,
            done: this.index++ === this.length - 1,
        };
    }
}
