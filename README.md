
Run single lines of Javascript in a save environment. Uses [esprima](https://github.com/jquery/esprima) to generate the abstract syntax tree (AST) from a given code string.

## API

``` js
let evaluator = new EsEval.evaluator();

// simple program
evaluator.setProgram('1 + 2').start(); // returns 3

// program using scope
evaluator.setProgram('a.map((x,i) => x*i + b).join("; ")');
evaluator.setScope({ a: [1, 2, 3], b: 2 }).start(); // returns "2; 4; 8"
evaluator.setScope({ a: [0, 1, 2], b: "0" }).start(); // returns "00; 10; 40"
```
