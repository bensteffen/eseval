var esprima = require('esprima');

var EsprimaEvaluator = (function() {
    function EsprimaEvaluator() {
        this.scope = {};
        
        this.globalScope = {
            Math: Math,
            Date: Date,
            parseInt: parseInt,
            parseFloat: parseFloat
        };
    }

    EsprimaEvaluator.prototype.setProgram = function(program) {
        this.program = program;
        this.ast = null;
        return this;
    }

    EsprimaEvaluator.prototype.setAst= function(ast) {
        this.ast = ast;
        return this;
    }

    EsprimaEvaluator.prototype.setScope = function(scope) {
        this.scope = scope;
        return this;
    }

    EsprimaEvaluator.prototype.start = function() {
        if (!this.program && !this.ast) {
            throw('Cannot evaluate: Missing program or AST.');
        }
        if (!this.ast) {
            var ast = esprima.parseScript(this.program);
            if (!(ast.type === 'Program' && ast.body)) {
                throw('Can only evaluate JS programs with a body.');
            }
            this.ast = ast.body[0];
        }
        return this.evaluate(this.ast);
    }

    EsprimaEvaluator.prototype.evaluate = function(expression) {
        if (expression === null || expression === undefined) {
            return expression;
        }
        var result;
        switch (expression.type) {
            case 'Literal':
                result = this.evaluateLiteral(expression);
                break;
            case 'Identifier':
                result = this.evaluateIdentifier(expression);
                break;
            case 'ArrayExpression':
                result = this.evaluateArrayExpression(expression);
                break;
            case 'ObjectExpression':
                result = this.evaluateObjectExpression(expression);
                break;
            case 'MemberExpression':
                result = this.evaluateMemberExpression(expression);
                break;
            case 'ArrowFunctionExpression':
                result = this.evaluateArrowFunctionExpression(expression);
                break;
            case 'CallExpression':
                result = this.evaluateCallExpression(expression);
                break;
            case 'NewExpression':
                result = this.evaluateNewExpression(expression);
                break;
            case 'UnaryExpression':
                result = this.evaluateUnaryExpression(expression);
                break;
            case 'BinaryExpression':
                result = this.evaluateBinaryExpression(expression);
                break;
            case 'LogicalExpression':
                result = this.evaluateLogicalExpression(expression);
                break;
            case 'ExpressionStatement':
                result = this.evaluateExpressionStatement(expression);
                break;
            case 'ConditionalExpression':
                result = this.evaluateConditionalExpression(expression);
                break;
            default:
                return expression;
        }
        return this.evaluate(result);
    }

    EsprimaEvaluator.prototype.evaluateLiteral = function(literal) {
        return literal.value;
    }

    EsprimaEvaluator.prototype.evaluateIdentifier = function(identifier) {
        if (this.scope[identifier.name] !== undefined) {
            return this.scope[identifier.name];
        }
        if (this.globalScope[identifier.name] !== undefined) {
            return this.globalScope[identifier.name];
        }
        return identifier.name;
    }

    EsprimaEvaluator.prototype.evaluateArrayExpression = function(expression) {
        var array = [];
        var self = this;
        expression.elements.forEach(function(elementExpression) {
            var element = self.evaluate(elementExpression);
            array.push(element)
        });
        return array;
    }

    EsprimaEvaluator.prototype.evaluateObjectExpression = function(expression) {
        var object = {};
        var self = this;
        expression.properties.forEach(function(property) {
            var key = self.evaluate(property.key);
            var value = self.evaluate(property.value);
            object[key] = value;
        });
        return object;
    }

    EsprimaEvaluator.prototype.evaluateMemberExpression = function(expression) {
        var object = this.evaluate(expression.object);
        var property;
        if (expression.property.type === 'Identifier') {
            property = expression.property.name;
        } else {
            property = this.evaluate(expression.property);
        }
        return object[property];
    }

    EsprimaEvaluator.prototype.evaluateArrowFunctionExpression = function(expression) {
        var parameterNames = expression.params.map(function(p) { return p.name });
        var fcnEvaluator = new EsprimaEvaluator().setAst(expression.body);
        var self = this;
        var callback = function() {
            var thisArguments = arguments;
            var fcnScope = self.scope;
            parameterNames.forEach(function(name, i) {
                fcnScope[name] = thisArguments[i];
            });
            var result = fcnEvaluator.setScope(fcnScope).start();
            return result;
        }
        return callback;
    }

    EsprimaEvaluator.prototype.evaluateCallExpression = function(expression) {
        var thisArg = null;
        if (expression.callee.type === 'MemberExpression') {
            thisArg = this.evaluate(expression.callee.object);
        }
        var fcn = this.evaluate(expression.callee);

        var self = this;
        var args = expression.arguments.map(function(arg) { return self.evaluate(arg) });

        return fcn.apply(thisArg, args)
    }

    EsprimaEvaluator.prototype.evaluateNewExpression = function(expression) {
        var constr = this.evaluate(expression.callee);

        var self = this;
        var args = expression.arguments.map(function(arg) { return self.evaluate(arg) });

        return new (Function.prototype.bind.apply(constr, [null].concat(args)));
    }

    EsprimaEvaluator.prototype.evaluateExpressionStatement = function(stmt) {
        return stmt.expression;
    }

    EsprimaEvaluator.prototype.evaluateUnaryExpression = function(expression) {
        var argument = this.evaluate(expression.argument);
        switch (expression.operator) {
            case '+'     : return +argument;
            case '-'     : return -argument;
            case '!'     : return !argument;
            case 'typeof': return typeof argument;
            default: throw(Error('Operator ' + expression.operator + ' not supported.'))
        }
    }

    EsprimaEvaluator.prototype.evaluateBinaryExpression = function(expression) {
        var left = this.evaluate(expression.left);
        var right = this.evaluate(expression.right);
        switch (expression.operator) {
            case '+'  : return left  +  right;
            case '-'  : return left  -  right;
            case '*'  : return left  *  right;
            case '/'  : return left  /  right;
            case '==' : return left  == right;
            case '!=' : return left  != right;
            case '===': return left === right;
            case '!==': return left !== right;
            case '>'  : return left  >  right;
            case '>=' : return left  >= right;
            case '<'  : return left  <  right;
            case '<=' : return left  <= right;
            default: throw(Error('Operator ' + expression.operator + ' not supported.'))
        }
    }

    EsprimaEvaluator.prototype.evaluateLogicalExpression = function(expression) {
        var left = this.evaluate(expression.left);
        var right = this.evaluate(expression.right);
        switch (expression.operator) {
            case '&&'  : return left && right;
            case '||'  : return left || right;
        }
    }

    EsprimaEvaluator.prototype.evaluateConditionalExpression = function(expression) {
        var test = this.evaluate(expression.test);
        if (test) {
            return this.evaluate(expression.consequent);
        } else {
            return this.evaluate(expression.alternate);
        }
    }

    return EsprimaEvaluator;
}());

export {
    EsprimaEvaluator
};