# Analisador Sintático LL(1)

Aplicação desenvolvida para a disciplina de Compiladores — URI Erechim.  
Analisador Sintático Preditivo Tabular LL(1), que pemite visualizar o comportamento da pilha, da entrada e das produções aplicadas durante o reconhecimento de sentenças.

## Acesso Online

O projeto pode ser executado diretamente no navegador, sem instalação:  
https://suzanadeliberal.github.io/TDECompiladores/

## Funcionalidades

- Visualização da gramática, conjuntos FIRST e FOLLOW e tabela de parsing LL(1)
- Análise de sentenças passo a passo ou de uma só vez
- Exibição da pilha, entrada restante e ação em cada iteração
- Identificação de sentenças aceitas e rejeitadas
- Geração automática de sentenças válidas
- Geração de sentenças aleatórias

## Gramática Utilizada

```
S → aA | bB
A → cC | dD | bA
B → cS | dDA
C → aS | ε
D → cCb
```

## Conjuntos FIRST e FOLLOW

| Não-Terminal | FIRST      | FOLLOW      |
|:------------:|:----------:|:-----------:|
| S            | a, b       | $, b        |
| A            | c, d, b    | $, b        |
| B            | c, d       | $, b        |
| C            | a, ε       | $, b        |
| D            | c          | $, b, c, d  |

## Tabela de Parsing LL(1)

| NT/T | a         | b         | c         | d          | $       |
|:----:|:---------:|:---------:|:---------:|:----------:|:-------:|
| S    | S → aA    | S → bB    | —         | —          | —       |
| A    | —         | A → bA    | A → cC    | A → dD     | —       |
| B    | —         | —         | B → cS    | B → dDA    | —       |
| C    | C → aS    | C → ε     | —         | —          | C → ε   |
| D    | —         | —         | D → cCb   | —          | —       |

## Tecnologias

HTML, CSS e JavaScript puro — sem dependências externas.

## Autoras

Caroline Deon e Suzana Deliberal  
